#[macro_use]
extern crate rocket;
extern crate rocket_cors;
use chrono::{DateTime, Utc , TimeZone};
use bip39::{Language, Mnemonic, MnemonicType, Seed};
use rocket::serde::{Deserialize, json::{Json, Value, json}};
use rocket::State;
use rocket::tokio::time::{sleep, Duration};
use solana_client::rpc_client::RpcClient;
use rocket::http::Status;
use solana_sdk::{
    account::from_account,
    clock::Clock,
    commitment_config::CommitmentConfig,
    signer::Signer,
    system_instruction,
    sysvar,
    transaction::Transaction,
    pubkey::Pubkey,
    signature::{keypair_from_seed, read_keypair_file, write_keypair_file},
    native_token::{lamports_to_sol, sol_to_lamports},
};
use std::str::FromStr;
use tokio::sync::Mutex;
use mongodb::{Client, options::ClientOptions};
use mongodb::bson::{doc, Bson, Binary};
use aes::Aes256;
use aes::cipher::{BlockCipher, KeyInit,BlockEncrypt };
use aes::cipher::generic_array::GenericArray;
use cbc::Encryptor;
use rand::Rng;
use block_padding::Pkcs7;
use aes::cipher::{BlockEncryptMut};

use bcrypt::{hash, verify};
use jsonwebtoken::{decode, encode, Header, Algorithm, EncodingKey, DecodingKey, Validation};
use mongodb::bson::oid::ObjectId;
use serde::Serialize;
use std::collections::HashSet;
use rocket::fairing::{Fairing, Info, Kind};
use rocket::{Request, Response};
use rocket::{Build, Rocket};
use rocket_cors::{AllowedHeaders, AllowedOrigins, CorsOptions, Cors , AllOrSome};
use rocket::http::Method;
use futures::stream::StreamExt; 
use mongodb::bson::Document;
use reqwest::Client as HttpClient;
use rocket::{Data};
use rocket::request::{FromRequest, Outcome};
use std::collections::HashMap;



const SERVER_URL: &str = "https://api.testnet.solana.com";


#[derive(Deserialize)]
struct Claims {
    email: String,
    exp: usize,
}



#[derive(Deserialize)]
struct SignoutInput {
    email: String,
}

#[post("/signout", format = "application/json", data = "<input>")]
async fn signout(input: Json<SignoutInput>, state: &State<SolanaState>) -> Json<Value> {
    let database = state.mongodb.database("Cluster0");
    let collection: mongodb::Collection<mongodb::bson::Document> = database.collection("users");

    // Find the user by email in the MongoDB database
    let user_doc = collection.find_one(doc! { "email": &input.email }, None).await;

    if let Ok(Some(user)) = user_doc {
        // Invalidate token (you can set token as expired or null in the database)
        let update_doc = doc! { "$set": { "token": Bson::Null } };
        let result = collection.update_one(doc! { "email": &input.email }, update_doc, None).await;

        if let Ok(update_result) = result {
            if update_result.matched_count == 1 {
                return Json(json!({ "status": "User signed out successfully" }));
            }
        }

        Json(json!({ "error": "Signout failed. Try again later." }))
    } else {
        Json(json!({ "error": "User not found." }))
    }
}



#[derive(Deserialize)]
struct FreezeInput {
    email: String,
}

#[post("/freeze", format = "application/json", data = "<input>")]
async fn freeze_account(input: Json<FreezeInput>, state: &State<SolanaState>) -> Json<Value> {
    let database = state.mongodb.database("Cluster0");
    let collection: mongodb::Collection<mongodb::bson::Document> = database.collection("users");

    // Find the user by email
    let user_doc = collection.find_one(doc! { "email": &input.email }, None).await;

    if let Ok(Some(user)) = user_doc {
        // Check if the account is already frozen
        let is_frozen = user.get_bool("freeze").unwrap_or(false);
        if is_frozen {
            return Json(json!({ "error": "Account is already frozen." }));
        }

        // Set the freeze for 12 hours (chrono duration)
        let freeze_expiration = Utc::now() + chrono::Duration::hours(12);

        // Update the user's freeze status, set the expiration time, and sign them out
        collection.update_one(
            doc! { "email": &input.email },
            doc! { 
                "$set": { 
                    "freeze": true, 
                    "freeze_expiration": mongodb::bson::DateTime::from_system_time(freeze_expiration.into()),
                    "token": Bson::Null // Invalidate the token, effectively signing them out
                }
            },
            None
        ).await.unwrap();

        Json(json!({ "status": "Account frozen for 12 hours and user signed out." }))
    } else {
        Json(json!({ "error": "User not found." }))
    }
}

// Struct to hold request information
struct RequestRecord {
    count: u32,
    last_request: i64, // Unix timestamp of the last request
}

// Shared state for rate limiting
struct RateLimiter {
    requests: Mutex<HashMap<String, RequestRecord>>,
    max_requests: u32,
    window_seconds: i64,
}

// Function to check rate limits
impl RateLimiter {
    async fn check_rate_limit(&self, identifier: &str) -> bool {
        let mut requests = self.requests.lock().await;
        let current_time = Utc::now().timestamp();

        if let Some(record) = requests.get_mut(identifier) {
            if current_time - record.last_request < self.window_seconds {
                if record.count >= self.max_requests {
                    return false; // Rate limit exceeded
                }
                record.count += 1; // Increment request count
            } else {
                record.count = 1;
                record.last_request = current_time;
            }
        } else {
            requests.insert(identifier.to_string(), RequestRecord {
                count: 1,
                last_request: current_time,
            });
        }
        true
    }
}

// Define the request guard to extract the client IP
struct ClientIp(Option<String>);

#[rocket::async_trait]
impl<'r> rocket::request::FromRequest<'r> for ClientIp {
    type Error = ();

    async fn from_request(request: &'r Request<'_>) -> rocket::request::Outcome<Self, Self::Error> {
        let ip = request.client_ip().map(|ip| ip.to_string()).unwrap_or_else(|| "unknown".to_string());
        rocket::request::Outcome::Success(ClientIp(Some(ip)))
    }
}



#[derive(Deserialize)]
struct SigninInput {
    email: String,
    password: String,
}
#[post("/signin", format = "application/json", data = "<input>")]
async fn signin(input: Json<SigninInput>, state: &State<SolanaState>,client_ip: ClientIp, rate_limiter: &State<RateLimiter>) -> Json<Value> {
    let client_ip_str = client_ip.0.clone().unwrap_or_else(|| "unknown".to_string());

    // Check rate limit using the client's IP as the identifier
    if !rate_limiter.check_rate_limit(&client_ip_str).await {
        return Json(json!({ "error": "Rate limit exceeded. Try again later." }));
    }
    // Check the rate limit
    let database = state.mongodb.database("Cluster0");
    let collection: mongodb::Collection<mongodb::bson::Document> = database.collection("users");

    // Find the user by email
    let user_doc = collection.find_one(doc! { "email": &input.email }, None).await;
    
    if let Ok(Some(user)) = user_doc {
        // Check if account is frozen and if the freeze has expired
        let is_frozen = user.get_bool("freeze").unwrap_or(false);
        let freeze_expiration = user.get_datetime("freeze_expiration").ok();

        // If the account is frozen, check if the freeze expiration has passed
        if is_frozen {
            if let Some(expiration) = freeze_expiration {
                // Convert `mongodb::bson::DateTime` to `chrono::DateTime<Utc>`
                let expiration_chrono = chrono::DateTime::<Utc>::from_utc(
                    chrono::NaiveDateTime::from_timestamp_millis(expiration.timestamp_millis()).unwrap(),
                    Utc,
                );
            
                if Utc::now() >= expiration_chrono {
                    // Unfreeze the account automatically
                    collection.update_one(
                        doc! { "email": &input.email },
                        doc! { "$set": { "freeze": false, "freeze_expiration": Bson::Null } },
                        None
                    ).await.unwrap();
                } else {
                    // Account is still frozen
                    return Json(json!({ "error": "Your account is currently frozen. Please wait until the freeze period ends." }));
                }
            }
            
        }

        // Verify the password
        let hashed_password = user.get_str("password").unwrap();
        if !verify(&input.password, hashed_password).unwrap() {
            return Json(json!({ "error": "Invalid email or password." }));
        }

        // Update the last active timestamp
        collection.update_one(
            doc! { "email": &input.email },         // Find the user by email
            doc! { "$set": { "last_active": mongodb::bson::DateTime::from_system_time(Utc::now().into()) } },
            None
        ).await.unwrap();

        // Generate and return the token (JWT)
        let claims = json!({
            "email": input.email,
            "exp": (Utc::now() + chrono::Duration::hours(1)).timestamp(),
        });
        
        let token = encode(
            &Header::new(Algorithm::HS256),
            &claims,
            &EncodingKey::from_secret("your_secret_key".as_ref())
        ).unwrap();

        Json(json!({ "status": "success", "token": token }))
    } else {
        Json(json!({ "error": "User not found." }))
    }
}


struct SolanaState {
    client: Mutex<RpcClient>,
    mongodb: Client,
    vulnerabilities: Mutex<serde_json::Value>,
}

#[get("/cluster_info")]
async fn cluster_info(state: &State<SolanaState>) -> Json<Value> {
    let client = state.client.lock().await;
    match client.get_version() {
        Ok(version) => {
            match client.get_account_with_commitment(&sysvar::clock::id(), CommitmentConfig::finalized()) {
                Ok(result) => {
                    let (slot, timestamp) = match result.value {
                        Some(clock_account) => {
                            let clock: Clock = from_account(&clock_account).expect("Failed to convert clock account");
                            (result.context.slot, clock.unix_timestamp)
                        }
                        None => return Json(json!({"error": "Clock account not found"})),
                    };

                    let datetime = if timestamp >= 0 {
                        Utc.from_utc_datetime(&chrono::NaiveDateTime::from_timestamp(timestamp, 0))
                            .format("%Y-%m-%d %H:%M:%S")
                            .to_string()
                    } else {
                        "Invalid timestamp".to_string()
                    };

                    Json(json!( {
                        "version": version.solana_core,
                        "slot": slot,
                        "time": datetime,
                    }))
                }
                Err(err) => Json(json!({"error": format!("Failed to fetch clock account: {}", err)})),
            }
        }
        Err(err) => Json(json!({"error": format!("Failed to get cluster version: {}", err)})),
    }
}


#[get("/supply")]
async fn supply(state: &State<SolanaState>) -> Json<Value> {
    let client = state.client.lock().await;
    match client.supply() {
        Ok(supply_response) => {
            let supply = supply_response.value;
            Json(json!( {
                "total_supply": lamports_to_sol(supply.total),
                "circulating_supply": lamports_to_sol(supply.circulating),
                "non_circulating_supply": lamports_to_sol(supply.non_circulating),
            }))
        }
        Err(err) => Json(json!({"error": format!("Failed to fetch supply: {}", err)})),
    }
}

#[derive(Deserialize)]
struct KeyGenInput {
    output: String,
    mnemonic_word_count: usize,
    passphrase: Option<String>,
}

#[post("/keygen", format = "application/json", data = "<input>")]
async fn keygen(input: Json<KeyGenInput>) -> Json<Value> {
    let mnemonic_type = MnemonicType::for_word_count(input.mnemonic_word_count).unwrap();
    let mnemonic = Mnemonic::new(mnemonic_type, Language::English);
    let seed = match &input.passphrase {
        Some(phrase) => Seed::new(&mnemonic, phrase),
        None => Seed::new(&mnemonic, ""),
    };
    let keypair = keypair_from_seed(seed.as_bytes()).unwrap();
    write_keypair_file(&keypair, &input.output).unwrap();
    
    Json(json!( {
        "mnemonic": mnemonic.phrase(),
        "public_key": keypair.pubkey().to_string(),
    }))
}



#[derive(Deserialize)]
struct BalanceInput {
    email: String,
}

#[post("/balance", format = "application/json", data = "<input>")]
async fn balance(input: Json<BalanceInput>, state: &State<SolanaState>) -> Json<Value> {
    // Log the input request
    println!("Received balance request for email: {}", input.email);

    // Lock the Solana RPC client
    let client = state.client.lock().await;
    
    // Access the MongoDB database and collection
    let database = state.mongodb.database("Cluster0");
    let collection: mongodb::Collection<mongodb::bson::Document> = database.collection("users");

    // Log MongoDB query attempt
    println!("Querying MongoDB for email: {}", input.email);

    // Find the user by email in MongoDB
    let user_doc = collection.find_one(doc! { "email": &input.email }, None).await;

    // If user is found
    if let Ok(Some(user)) = user_doc {
        println!("User found: {}", input.email);

        // Try to retrieve the user's public key
        let user_public_key_str = match user.get_str("public_key") {
            Ok(key) => {
                println!("Public key found: {}", key);
                key
            },
            Err(_) => {
                println!("Public key not found in MongoDB document for user: {}", input.email);
                return Json(json!({ "error": "Public key not found" }));
            }
        };

        // Try to convert the public key from a string
        let user_public_key = match Pubkey::from_str(user_public_key_str) {
            Ok(pk) => pk,
            Err(_) => {
                println!("Invalid public key format for user: {}", input.email);
                return Json(json!({ "error": "Invalid public key format" }));
            }
        };

        // Fetch the user's balance from Solana
        println!("Fetching balance for public key: {}", user_public_key_str);
        match client.get_balance_with_commitment(&user_public_key, CommitmentConfig::finalized()) {
            Ok(balance) => {
                println!("Balance fetched successfully for public key: {}", user_public_key_str);
                Json(json!({
                    "address": user_public_key_str,
                    "balance": lamports_to_sol(balance.value),  // Convert lamports to SOL
                }))
            },
            Err(err) => {
                println!("Failed to fetch balance: {}", err);
                Json(json!({ "error": format!("Failed to fetch balance: {}", err) }))
            }
        }
    } else {
        println!("User not found for email: {}", input.email);
        return Json(json!({ "error": "User email not found" }));
    }
}





#[derive(Deserialize)]
struct AirdropInput {
    email: String,
    sol: f64,
}

#[post("/airdrop", format = "application/json", data = "<input>")]
async fn airdrop(input: Json<AirdropInput>, state: &State<SolanaState>) -> Json<Value> {
    let client = state.client.lock().await;
    let database = state.mongodb.database("Cluster0");
    let collection: mongodb::Collection<mongodb::bson::Document> = database.collection("users");

    // Fetch user from the database by email
    let user_doc = collection.find_one(doc! { "email": &input.email }, None).await;
    
    if let Ok(Some(user)) = user_doc {
        // Retrieve user's public key
        let user_public_key = user.get_str("public_key").unwrap();
        
        // Convert SOL amount to lamports
        let lamports = sol_to_lamports(input.sol);
        
        // Request airdrop
        match Pubkey::from_str(user_public_key) {
            Ok(pubkey) => match client.request_airdrop(&pubkey, lamports) {
                Ok(signature) => {
                    sleep(Duration::from_millis(100)).await;
                    Json(json!({"status": "Airdrop requested", "signature": signature}))
                }
                Err(err) => Json(json!({"error": format!("Airdrop failed: {}", err)})),
            },
            Err(_) => Json(json!({"error": "Invalid public key format"})),
        }
    } else {
        Json(json!({ "error": "User email not found" }))
    }
}


#[derive(Deserialize)]
struct TransferInput {
    sender_email: String,
    password: String,
    recipient_email: Option<String>,
    recipient_public_key: Option<String>,
    sol: f64,
    lifetime_seconds: Option<u64>,
}

#[derive(Deserialize)]
struct TransferConfirmationInput {
    transfer_id: String,
    proceed: bool,
}

#[post("/transfer_confirmation", format = "application/json", data = "<input>")]
async fn transfer_confirmation(input: Json<TransferConfirmationInput>, state: &State<SolanaState>) -> Json<Value> {
    let client = state.client.lock().await;
    let database = state.mongodb.database("Cluster0");
    let collection: mongodb::Collection<mongodb::bson::Document> = database.collection("transactions");

    // Retrieve the transfer that was previously initiated
    let transfer_doc = collection.find_one(doc! { "_id": ObjectId::parse_str(&input.transfer_id).unwrap() }, None).await;

    if let Ok(Some(transfer)) = transfer_doc {
        // Execute the transfer since the user confirmed proceeding
        let sender_public_key = transfer.get_str("sender").unwrap();
        let recipient_public_key = transfer.get_str("recipient").unwrap();
        let amount = transfer.get_f64("amount").unwrap();

        // Proceed with the transfer after user confirmation
        let transfer_result = execute_transfer(sender_public_key, recipient_public_key.to_string(), amount, &client, state).await;
        return transfer_result;
    } else {
        Json(json!({ "error": "Transfer not found" }))
    }
}

#[post("/transfer", format = "application/json", data = "<input>")]
async fn transfer(input: Json<TransferInput>, state: &State<SolanaState>) -> Json<Value> {
    let client = state.client.lock().await;
    let database = state.mongodb.database("Cluster0");
    let collection: mongodb::Collection<mongodb::bson::Document> = database.collection("users");
    let vulnerabilities = state.vulnerabilities.lock().await;
    // Fetch the sender from the database using the provided email
    let sender_doc = collection.find_one(doc! { "email": &input.sender_email }, None).await;

    // Check if the sender exists
    if let Ok(Some(sender)) = sender_doc {
        // Verify the sender's password
        let hashed_password = sender.get_str("password").unwrap();
        if !bcrypt::verify(&input.password, hashed_password).unwrap() {
            return Json(json!({ "error": "Invalid password" }));
        }

        // Determine the recipient's public key
        let recipient_public_key_str = if let Some(email) = &input.recipient_email {
            // Find the recipient by email if provided
            let recipient_doc = collection.find_one(doc! { "email": email }, None).await;
            if let Ok(Some(recipient)) = recipient_doc {
                recipient.get_str("public_key").unwrap().to_string()
            } else {
                return Json(json!({ "error": "Recipient email not found" }));
            }
        } else if let Some(public_key) = &input.recipient_public_key {
            public_key.clone()
        } else {
            return Json(json!({ "error": "You must provide either recipient email or public key" }));
        };
        if let Some(vulnerability_summary) = check_vulnerabilities(&recipient_public_key_str, &vulnerabilities) {
            return Json(json!({
                "status": "warning",
                "message": "Vulnerable smart contract detected.",
                "vulnerability_summary": vulnerability_summary
            }));
        }
        // Check if multisig is enabled for the sender
        let multisig_enabled = sender.get_bool("multisig_enabled").unwrap_or(false);
        if multisig_enabled {
            // Retrieve the list of signers from the sender's document
            let signers: Vec<String> = sender.get_array("signers").unwrap_or(&Vec::new())
                .iter().map(|s| s.as_str().unwrap().to_string()).collect();

            // Create the transaction document with the required fields, including signers
            let transaction_doc = doc! {
                "sender": sender.get_str("public_key").unwrap(),
                "recipient": recipient_public_key_str,
                "amount": input.sol,
                "votes": [], // Votes will be added as signers approve the transaction
                "signers": signers.clone(), // Store the signers who need to approve this transaction
                "threshold": sender.get_i32("threshold").unwrap(),
                "lifetime": Bson::Int64(input.lifetime_seconds.unwrap_or(3600) as i64),
                "start_time": Bson::Int64(Utc::now().timestamp()),
                "status": "pending", // Transaction is pending until enough approvals are gathered
            };

            // Insert the transaction into the database
            let result = database.collection("transactions").insert_one(transaction_doc, None).await;
            return match result {
                Ok(inserted) => Json(json!({ "status": "Transfer initiated", "transfer_id": inserted.inserted_id.to_string() })),
                Err(_) => Json(json!({ "error": "Failed to initiate transfer" })),
            };
        } else {
            // If multisig is not enabled, execute the transfer directly
            let sender_public_key = sender.get_str("public_key").unwrap();
            let transfer_result = execute_transfer(sender_public_key, recipient_public_key_str, input.sol, &client, state).await;
            return transfer_result;
        }
    } else {
        Json(json!({ "error": "Sender not found" }))
    }
}
#[get("/transactions?<email>")]
async fn get_transactions_by_signer(email: String, state: &State<SolanaState>) -> Json<Value> {
    let database = state.mongodb.database("Cluster0");
    let collection = database.collection::<Document>("transactions");

    let user_doc = database
        .collection::<Document>("users")
        .find_one(doc! { "email": &email }, None)
        .await;

    if let Ok(Some(user)) = user_doc {
        let public_key = user.get_str("public_key").unwrap();

        // Fetch all transactions where the user is a signer
        let mut cursor = collection
            .find(doc! { "signers": public_key, "status": "pending" }, None)
            .await
            .unwrap();

        let mut transactions: Vec<Document> = Vec::new();

        // Iterate through the cursor manually and collect transactions
        while let Some(result) = cursor.next().await {
            match result {
                Ok(transaction) => transactions.push(transaction),
                Err(e) => return Json(json!({ "error": format!("Error fetching transactions: {}", e) })),
            }
        }

        Json(json!({ "transactions": transactions }))
    } else {
        Json(json!({ "error": "User not found" }))
    }
}


#[derive(Deserialize)]
struct VoteInput {
    transfer_id: String,
    signer_public_key: String,
    approve: bool,
}

#[post("/vote", format = "application/json", data = "<input>")]
async fn vote(input: Json<VoteInput>, state: &State<SolanaState>) -> Json<Value> {
    let database = state.mongodb.database("Cluster0");
    let collection: mongodb::Collection<mongodb::bson::Document> = database.collection("transactions");

    let transfer_doc = collection.find_one(doc! { "_id": ObjectId::parse_str(&input.transfer_id).unwrap() }, None).await;

    if let Ok(Some(transfer)) = transfer_doc {
        let current_time = Utc::now().timestamp();
        let start_time = transfer.get_i64("start_time").unwrap();
        let lifetime = transfer.get_i64("lifetime").unwrap();

        if current_time > start_time + lifetime {
            return Json(json!({ "error": "Transaction has expired" }));
        }

        let mut votes = transfer.get_array("votes").unwrap().clone();
        votes.push(Bson::Document(doc! {
            "signer": input.signer_public_key.clone(),
            "approve": input.approve
        }));

        let approvals: usize = votes.iter().filter(|vote| {
            if let Some(approve) = vote.as_document().unwrap().get_bool("approve").ok() {
                approve
            } else {
                false
            }
        }).count();
        let threshold = transfer.get_i32("threshold").unwrap() as usize;

        if approvals >= threshold {
            let sender_public_key = transfer.get_str("sender").unwrap();
            let recipient_public_key = transfer.get_str("recipient").unwrap();
            let amount = transfer.get_f64("amount").unwrap();

            let client = state.client.lock().await;
            execute_transfer(sender_public_key, recipient_public_key.to_string(), amount, &client , state).await;

            collection.update_one(
                doc! { "_id": ObjectId::parse_str(&input.transfer_id).unwrap() },
                doc! { "$set": { "status": "completed" } },
                None
            ).await;

            Json(json!({ "status": "Transfer completed" }))
        } else {
            collection.update_one(
                doc! { "_id": ObjectId::parse_str(&input.transfer_id).unwrap() },
                doc! { "$set": { "votes": votes } },
                None
            ).await;

            Json(json!({ "status": "Vote recorded", "approvals": approvals, "threshold": threshold }))
        }
    } else {
        Json(json!({ "error": "Transfer not found" }))
    }
}
async fn execute_transfer(
    sender: &str, 
    recipient: String, 
    amount: f64, 
    client: &RpcClient, 
    state: &State<SolanaState>
) -> Json<Value> {

    println!("Starting transfer from {} to {} of {} SOL", sender, recipient, amount);

    let database = state.mongodb.database("Cluster0");
    let collection: mongodb::Collection<mongodb::bson::Document> = database.collection("users");

    // Update the query to use 'public_key' instead of 'email'
    println!("Looking up sender in the database using public key: {}", sender);

    // Find the sender by public_key
    let sender_doc = collection.find_one(doc! { "public_key": sender }, None).await;

    if let Ok(Some(sender)) = sender_doc {
        println!("Sender found in the database: {:?}", sender);

        // Retrieve sender private key
        let sender_private_key = match sender.get("private_key") {
            Some(Bson::Binary(binary)) => binary.bytes.as_slice(),
            _ => {
                println!("Private key not found or invalid format");
                return Json(json!({"error": "Private key not found or invalid format"}));
            },
        };

        // Retrieve sender public key (already have it in 'sender' but keeping for completeness)
        let sender_pubkey_str = match sender.get_str("public_key") {
            Ok(pubkey) => pubkey,
            Err(_) => {
                println!("Public key not found for sender");
                return Json(json!({"error": "Public key not found"}));
            },
        };

        println!("Sender public key: {}", sender_pubkey_str);
        println!("Recipient public key: {}", recipient);

        // Convert keys to Pubkey format
        let sender_keypair = match solana_sdk::signature::Keypair::from_bytes(sender_private_key) {
            Ok(keypair) => keypair,
            Err(e) => {
                println!("Error creating Keypair from sender private key: {}", e);
                return Json(json!({"error": "Failed to create keypair from private key"}));
            }
        };
        let lamports = sol_to_lamports(amount);
        let recipient_pubkey = match Pubkey::from_str(&recipient) {
            Ok(pk) => pk,
            Err(e) => {
                println!("Invalid recipient public key format: {}", e);
                return Json(json!({"error": "Invalid recipient public key"}));
            }
        };
        let sender_pubkey = match Pubkey::from_str(sender_pubkey_str) {
            Ok(pk) => pk,
            Err(e) => {
                println!("Invalid sender public key format: {}", e);
                return Json(json!({"error": "Invalid sender public key"}));
            }
        };

        println!("Attempting to transfer {} lamports", lamports);

        // Build the transaction
        let transfer_instruction = system_instruction::transfer(&sender_pubkey, &recipient_pubkey, lamports);
        let latest_blockhash = match client.get_latest_blockhash() {
            Ok(blockhash) => blockhash,
            Err(e) => {
                println!("Failed to get latest blockhash: {}", e);
                return Json(json!({"error": "Failed to get latest blockhash"}));
            }
        };

        println!("Latest blockhash: {:?}", latest_blockhash);

        let transaction = Transaction::new_signed_with_payer(
            &[transfer_instruction],
            Some(&sender_pubkey),
            &[&sender_keypair],
            latest_blockhash,
        );

        // Send the transaction and log the result
        match client.send_transaction(&transaction) {
            Ok(signature) => {
                println!("Transaction sent successfully with signature: {}", signature);
                Json(json!({"status": "Transfer successful", "signature": signature}))
            }
            Err(e) => {
                println!("Failed to send transaction: {}", e);
                Json(json!({"error": format!("Transfer failed: {}", e)}))
            }
        }
    } else {
        println!("Sender not found in the database");
        Json(json!({ "error": "Sender not found" }))
    }
}

#[get("/user?<email>")]
async fn get_user(email: String, state: &State<SolanaState>) -> Json<Value> {
    let database = state.mongodb.database("Cluster0");
    let collection = database.collection::<Document>("users");

    let user_doc = collection.find_one(doc! { "email": email }, None).await;

    if let Ok(Some(user)) = user_doc {
        let public_key = user.get_str("public_key").unwrap();
        return Json(json!({ "public_key": public_key }));
    }

    Json(json!({ "error": "User not found" }))
}


#[derive(Deserialize)]
struct WormholeTransferInput {
    sender_email: String,
    password: String,
    sol: f64,
    recipient_eth_address: String,  // Ethereum address of the recipient
}

#[post("/wormhole_transfer", format = "application/json", data = "<input>")]
async fn wormhole_transfer(input: Json<WormholeTransferInput>, state: &State<SolanaState>) -> Result<Json<Value>, rocket::http::Status> {
    let client = state.client.lock().await;
    let database = state.mongodb.database("Cluster0");
    let collection: mongodb::Collection<mongodb::bson::Document> = database.collection("users");

    println!("Received wormhole transfer request for sender: {}", input.sender_email);

    // Fetch sender from the database by email
    let sender_doc = collection.find_one(doc! { "email": &input.sender_email }, None).await
        .map_err(|err| {
            println!("Error fetching user: {:?}", err);
            Status::InternalServerError
        })?;

    if let Some(sender) = sender_doc {
        println!("User found: {}", input.sender_email);

        // Verify the password
        let hashed_password = sender.get_str("password").map_err(|err| {
            println!("Error retrieving password: {:?}", err);
            Status::InternalServerError
        })?;
        
        if !bcrypt::verify(&input.password, hashed_password).map_err(|err| {
            println!("Password verification failed: {:?}", err);
            Status::Unauthorized
        })? {
            println!("Password verification failed for user: {}", input.sender_email);
            return Err(Status::Unauthorized);
        }

        // Retrieve sender's public and private keys
        let sender_public_key = sender.get_str("public_key").map_err(|err| {
            println!("Error retrieving public key: {:?}", err);
            Status::InternalServerError
        })?;
        
        let sender_private_key = sender.get_binary_generic("private_key").map_err(|err| {
            println!("Error retrieving private key: {:?}", err);
            Status::InternalServerError
        })?.as_slice();

        let sender_pubkey = Pubkey::from_str(sender_public_key).map_err(|err| {
            println!("Error parsing public key: {:?}", err);
            Status::InternalServerError
        })?;

        println!("User's public key: {}", sender_public_key);

        // Correct Wormhole bridge public key for Testnet
        let wormhole_bridge_pubkey = Pubkey::from_str("3oVf5JkHES5yXaVuZPCoCHhehPWT4BQRTZp5F81HkXm1").map_err(|err| {
            println!("Error parsing Wormhole bridge program ID: {:?}", err);
            Status::InternalServerError
        })?;

        // Amount to transfer (in lamports)
        let lamports = sol_to_lamports(input.sol);
        println!("Amount to transfer in lamports: {}", lamports);

        // Instruction to lock tokens into Wormhole bridge program
        let lock_instruction = system_instruction::transfer(
            &sender_pubkey,
            &wormhole_bridge_pubkey, // The bridge program's address
            lamports,
        );

        // Get the recent blockhash for signing
        let latest_blockhash = client.get_latest_blockhash().map_err(|err| {
            println!("Error fetching latest blockhash: {:?}", err);
            Status::InternalServerError
        })?;

        println!("Latest blockhash: {:?}", latest_blockhash);

        // Create and sign the transaction
        let keypair = solana_sdk::signature::Keypair::from_bytes(sender_private_key).map_err(|err| {
            println!("Error creating keypair from private key: {:?}", err);
            Status::InternalServerError
        })?;

        let transaction = Transaction::new_signed_with_payer(
            &[lock_instruction],
            Some(&keypair.pubkey()),
            &[&keypair],
            latest_blockhash,
        );

        // Send the transaction to lock tokens in the Wormhole Bridge
        match client.send_transaction(&transaction) {
            Ok(signature) => {
                sleep(Duration::from_millis(100)).await;
                println!("Transaction sent successfully, signature: {:?}", signature);

                // Log the recipient Ethereum address for future VAA submission
                println!("Recipient Ethereum Address: {}", input.recipient_eth_address);

                Ok(Json(json!({"status": "Tokens locked in Wormhole", "signature": signature, "recipient": input.recipient_eth_address})))
            }
            Err(e) => {
                println!("Error sending transaction: {:?}", e);
                Err(Status::InternalServerError)
            }
        }
    } else {
        println!("User not found: {}", input.sender_email);
        Err(Status::NotFound)
    }
}


#[derive(Deserialize)]
struct WillInput {
    beneficiaries: Vec<Beneficiary>, // List of beneficiaries with percentages
    signers: Vec<String>,            // List of public keys of signers (executors)
    threshold: usize,                // Number of approvals required for the will to execute
    duration_months: usize,          // Time duration in months before the will can be executed
}




#[derive(Debug, Deserialize, Serialize)]
struct Will {
    beneficiaries: Vec<Beneficiary>, // Beneficiaries with percentages
    signers: Vec<String>,            // Executors' public keys
    threshold: usize,                // Number of approvals required
    approvals: Vec<String>,          // List of signers who have approved
    status: String,                  // "pending", "completed"
    start_time: DateTime<Utc>,       // The time when the will was created
    duration_months: usize,          // Duration before executors can approve the will
}

#[derive(Deserialize)]
struct WillApprovalInput {
    email: String,
    executor_public_key: String,
}
#[derive(Debug, Deserialize, Serialize)] // Add Deserialize here
struct Beneficiary {
    public_key: String,
    percentage: f64,
}
#[post("/approve_will", format = "application/json", data = "<input>")]
async fn approve_will(input: Json<WillApprovalInput>, state: &State<SolanaState>) -> Json<Value> {
    let database = state.mongodb.database("Cluster0");
    let collection: mongodb::Collection<mongodb::bson::Document> = database.collection("users");

    // Log the incoming request data
    println!("Received approval request for user: {}, executor: {}", input.email, input.executor_public_key);

    // Find the user by email in MongoDB
    let user_doc = collection.find_one(doc! { "email": &input.email }, None).await;

    // Log the outcome of the user search
    match user_doc {
        Ok(Some(user)) => {
            println!("User found: {:?}", user);

            // Log will lookup
            match user.get_document("will") {
                Ok(will_doc) => {
                    println!("Will found: {:?}", will_doc);

                    // Extract key details from the will
                    let signers: Vec<String> = will_doc.get_array("signers").unwrap().iter().map(|s| s.as_str().unwrap().to_string()).collect();
                    println!("Signers in will: {:?}", signers);

                    // Check if the executor is one of the signers
                    if !signers.contains(&input.executor_public_key) {
                        println!("Executor not found in signers list");
                        return Json(json!({ "error": "You are not an executor for this will" }));
                    }

                    let mut approvals: Vec<String> = will_doc.get_array("approvals").unwrap().iter().map(|s| s.as_str().unwrap().to_string()).collect();
                    let threshold = will_doc.get_i32("threshold").unwrap() as usize;
                    let duration_months = will_doc.get_i32("duration_months").unwrap();

                    println!("Approvals before: {:?}", approvals);

                    approvals.push(input.executor_public_key.clone());

                    println!("Approvals after: {:?}", approvals);

                    // Check if threshold is reached
                    if approvals.len() >= threshold {
                        println!("Threshold reached! Distributing assets...");

                        let user_public_key = user.get_str("public_key").unwrap();
                        let client = state.client.lock().await; // Lock the Solana client from the state

                        // Get the user's total balance
                        let user_balance = match client.get_balance_with_commitment(&Pubkey::from_str(user_public_key).unwrap(), CommitmentConfig::finalized()) {
                            Ok(balance_response) => balance_response.value,
                            Err(err) => {
                                println!("Error fetching balance: {}", err);
                                return Json(json!({ "error": format!("Failed to fetch balance: {}", err) }));
                            }
                        };

                        // Convert balance to SOL
                        let total_sol = lamports_to_sol(user_balance);
                        println!("User's total SOL balance: {}", total_sol);

                        // Distribute to each beneficiary based on their percentage
                        let beneficiaries = will_doc.get_array("beneficiaries").unwrap();
                        for beneficiary in beneficiaries {
                            let beneficiary_doc = beneficiary.as_document().unwrap();
                            let beneficiary_public_key = beneficiary_doc.get_str("public_key").unwrap();
                            let percentage = beneficiary_doc.get_f64("percentage").unwrap();

                            let amount_to_transfer = total_sol * (percentage / 100.0);
                            println!("Transferring {} SOL to {}", amount_to_transfer, beneficiary_public_key);

                            // Execute transfer
                            let transfer_result = execute_transfer(user_public_key, beneficiary_public_key.to_string(), amount_to_transfer, &client, state).await;

                            if let Json(Value::Object(mut transfer_result_obj)) = transfer_result {
                                transfer_result_obj.insert("message".to_string(), format!("Transferred {} SOL to {}", amount_to_transfer, beneficiary_public_key).into());
                                println!("Successfully transferred {} SOL to {}", amount_to_transfer, beneficiary_public_key);
                            } else {
                                println!("Error during transfer to {}", beneficiary_public_key);
                            }
                        }

                        // Mark will as completed
                        println!("Marking will as completed...");
                        collection.update_one(
                            doc! { "email": &input.email },
                            doc! { "$set": { "will.status": "completed", "will.approvals": approvals } },
                            None
                        ).await.unwrap();

                        println!("Will execution complete.");
                        return Json(json!({ "status": "Will executed and assets distributed." }));
                    } else {
                        println!("Threshold not reached, approvals: {}/{}", approvals.len(), threshold);
                    }

                    // Update approvals in MongoDB
                    let update_result = collection.update_one(
                        doc! { "email": &input.email },
                        doc! { "$set": { "will.approvals": &approvals } },
                        None
                    ).await;
                    
                    match update_result {
                        Ok(_) => println!("Approvals updated successfully."),
                        Err(err) => println!("Failed to update approvals: {}", err),
                    }

                },
                Err(err) => {
                    println!("Will not found: {}", err);
                    return Json(json!({ "error": "Will not found." }));
                }
            }
        },
        Ok(None) => {
            println!("User not found.");
            return Json(json!({ "error": "User not found." }));
        },
        Err(err) => {
            println!("Failed to find user: {}", err);
            return Json(json!({ "error": format!("Failed to find user: {}", err) }));
        }
    }

    Json(json!({ "error": "Will not found or user not found." }))
}

#[derive(Deserialize)]
struct WillInput2 {
    email: String,
    will: WillDetails, // Adjust to expect a nested `will` object
}

#[derive(Deserialize)]
struct WillDetails {
    beneficiaries: Vec<Beneficiary1>,
    signers: Vec<String>,
    threshold: usize,
    duration_months: usize,
}

#[derive(Deserialize)]
struct Beneficiary1 {
    public_key: String,
    percentage: f64,
}
#[post("/add_or_update_will", format = "application/json", data = "<input>")]
async fn add_or_update_will(input: Json<WillInput2>, state: &State<SolanaState>) -> Json<Value> {
    let database = state.mongodb.database("Cluster0");
    let collection: mongodb::Collection<mongodb::bson::Document> = database.collection("users");

    let user_email = &input.email;
    let will_data = &input.will; // Access the nested `will` object

    let user_doc = collection.find_one(doc! { "email": user_email }, None).await;

    match user_doc {
        Ok(Some(_user)) => {
            let beneficiaries = will_data.beneficiaries.iter().map(|b| {
                doc! { "public_key": &b.public_key, "percentage": b.percentage }
            }).collect::<Vec<_>>();

            let will_doc = doc! {
                "beneficiaries": beneficiaries,
                "signers": Bson::Array(will_data.signers.iter().map(|s| Bson::String(s.clone())).collect()),
                "threshold": will_data.threshold as i32,
                "approvals": Bson::Array(Vec::<Bson>::new()), // No approvals initially
                "status": "pending",
                "start_time": mongodb::bson::DateTime::from_system_time(Utc::now().into()),
                "duration_months": will_data.duration_months as i32,
            };

            let update_result = collection.update_one(
                doc! { "email": user_email },
                doc! { "$set": { "will": will_doc } },
                None,
            ).await;

            match update_result {
                Ok(_) => Json(json!({ "status": "Will added or updated successfully" })),
                Err(err) => Json(json!({ "error": format!("Failed to update will: {}", err) })),
            }
        }
        Ok(None) => Json(json!({ "error": "User not found" })),
        Err(err) => Json(json!({ "error": format!("Failed to find user: {}", err) })),
    }
}



#[derive(Deserialize)]
struct SignUpInput {
    email: String,
    password: String,
    backup_email: Option<String>,  // Optional backup account email
    multisig: Option<MultisigInput>, // Optional multisignature configuration
    will: Option<WillInput>,       // Optional will configuration
}

/// Struct for multisig configuration (e.g., how many signers and threshold).
#[derive(Deserialize)]
struct MultisigInput {
    signers: Vec<String>,          // List of public keys of signers
    threshold: usize,              // Number of approvals required
}

#[post("/signup", format = "application/json", data = "<input>")]
async fn signup(input: Json<SignUpInput>, state: &State<SolanaState>) -> Json<Value> {
    // Log the incoming sign-up request
    println!("Received signup request for email: {}", input.email);

    let email = &input.email;
    let password = &input.password;

    let database = state.mongodb.database("Cluster0");
    let collection: mongodb::Collection<mongodb::bson::Document> = database.collection("users");

    // Hash the password securely using bcrypt
    let hashed_password = match bcrypt::hash(password, bcrypt::DEFAULT_COST) {
        Ok(hashed) => {
            println!("Password hashed successfully for email: {}", email);
            hashed
        }
        Err(err) => {
            println!("Error hashing password for email {}: {}", email, err);
            return Json(json!({ "error": "Failed to hash password" }));
        }
    };

    // Generate Solana keypair
    let mnemonic_type = MnemonicType::Words12;
    let mnemonic = Mnemonic::new(mnemonic_type, Language::English);
    let seed = Seed::new(&mnemonic, "");
    let keypair = match keypair_from_seed(seed.as_bytes()) {
        Ok(kp) => {
            println!("Solana keypair generated successfully for email: {}", email);
            kp
        }
        Err(err) => {
            println!("Error generating Solana keypair for email {}: {}", email, err);
            return Json(json!({ "error": "Failed to generate Solana keypair" }));
        }
    };

    // Prepare data for MongoDB
    let public_key = keypair.pubkey().to_string();
    let private_key = keypair.to_bytes();
    println!("Generated public key: {}", public_key);

    // Insert new user data into MongoDB
    let mut new_user = doc! {
        "email": email,
        "password": hashed_password,
        "public_key": public_key.clone(),
        "private_key": Bson::Binary(Binary {
            subtype: mongodb::bson::spec::BinarySubtype::Generic,
            bytes: private_key.to_vec(),
        }),
        "freeze": false,  // Default freeze value
        "freeze_expiration": Bson::Null,
        "multisig_enabled": false,  // Default to no multisig
        "last_active": mongodb::bson::DateTime::from_system_time(Utc::now().into())
    };

    if let Some(multisig_config) = &input.multisig {
        println!("Multisig enabled for email: {}", email);
        new_user.insert("multisig_enabled", true);
        new_user.insert(
            "signers",
            Bson::Array(multisig_config.signers.iter().map(|s| Bson::String(s.clone())).collect()),
        );
        new_user.insert("threshold", multisig_config.threshold as i32);
    }

    if let Some(will_config) = &input.will {
        println!("Will configuration detected for email: {}", email);
        let beneficiaries = will_config.beneficiaries.iter().map(|beneficiary| {
            doc! {
                "public_key": &beneficiary.public_key,
                "percentage": beneficiary.percentage,
            }
        }).collect::<Vec<_>>();

        let will_doc = doc! {
            "beneficiaries": beneficiaries,
            "signers": Bson::Array(will_config.signers.iter().map(|s| Bson::String(s.clone())).collect()),
            "threshold": will_config.threshold as i32,
            "approvals": Bson::Array(Vec::<Bson>::new()), // No approvals initially
            "status": "pending",
            "start_time": mongodb::bson::DateTime::from_system_time(Utc::now().into()),
            "duration_months": will_config.duration_months as i32,
        };
        new_user.insert("will", will_doc);
    }

    // Log the final user document before insertion
    println!("Final user document to be inserted: {:?}", new_user);

    // Try inserting into MongoDB
    match collection.insert_one(new_user, None).await {
        Ok(insert_result) => {
            println!("User inserted into MongoDB successfully with ID: {:?}", insert_result.inserted_id);
            Json(json!({ "status": "Signup successful", "public_key": public_key }))
        }
        Err(err) => {
            println!("Error inserting user into MongoDB for email {}: {}", email, err);
            Json(json!({ "error": format!("Signup failed: {}", err) }))
        }
    }
}


fn encrypt_private_key(private_key: &[u8], encryption_key: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
    let cipher = Aes256::new_from_slice(encryption_key)?;
    let mut block = GenericArray::clone_from_slice(private_key);
    cipher.encrypt_block(&mut block);
    Ok(block.to_vec())  // Convert GenericArray into Vec<u8> and return it
    
}
fn check_vulnerabilities(recipient: &str, vulnerabilities: &serde_json::Value) -> Option<String> {
    // Log the recipient address for debugging
    println!("Checking vulnerabilities for recipient: {}", recipient);

    // Access the "Data Analytics" array in the JSON
    if let Some(data_analytics) = vulnerabilities.get("Data Analytics").and_then(|v| v.as_array()) {
        // Iterate over each entry in the "Data Analytics" array
        for entry in data_analytics {
            // Get the "Smart contract address" field
            if let Some(address) = entry.get("Smart contract address").and_then(|a| a.as_str()) {
                println!("Checking contract address: {}", address);
                // If the recipient matches the contract address
                if address == recipient {
                    println!("Match found for contract address: {}", address);
                    // Return the "Summary/rationale of risk tags marked true" field if available
                    if let Some(summary) = entry.get("Summary/rationale of risk tags marked true").and_then(|s| s.as_str()) {
                        return Some(summary.to_string());
                    }
                }
            }
        }
    }

    // If no vulnerabilities are found, return None
    println!("No vulnerabilities found for recipient: {}", recipient);
    None
}


#[derive(Deserialize)]
struct UserEmailInput {
    email: String,
}

#[get("/user_public_key?<email>")]
async fn get_public_key_by_email(email: String, state: &State<SolanaState>) -> Json<Value> {
    let database = state.mongodb.database("Cluster0");
    let collection = database.collection::<Document>("users");

    let user_doc = collection.find_one(doc! { "email": email }, None).await;

    if let Ok(Some(user)) = user_doc {
        let public_key = user.get_str("public_key").unwrap();
        return Json(json!({ "public_key": public_key }));
    }

    Json(json!({ "error": "User not found" }))
}

#[rocket::async_trait]
impl Fairing for RateLimiter {
    fn info(&self) -> Info {
        Info {
            name: "Rate Limiter",
            kind: Kind::Request,
        }
    }

    // This is where we inspect incoming requests
    async fn on_request(&self, request: &mut Request<'_>, _: &mut Data<'_>) {
        let client_ip = request.client_ip().map(|ip| ip.to_string()).unwrap_or_else(|| "unknown".to_string());

        // Check if the rate limit is exceeded for this client, await the result
        if !self.check_rate_limit(&client_ip).await {
            // Limit exceeded, cache the response status as 429 (Too Many Requests)
            request.local_cache(|| Status::TooManyRequests);
        }
    }
}



fn load_vulnerabilities(json_file_path: &str) -> Value {
    let file = std::fs::File::open(json_file_path).expect("Failed to open vulnerabilities file.");
    let vulnerabilities: Value = serde_json::from_reader(file).expect("Failed to parse JSON file.");
    println!("Vulnerabilities data loaded: {:?}", vulnerabilities);
    vulnerabilities
}
#[options("/signup")]
fn options_signup() -> rocket::http::Status {
    rocket::http::Status::Ok
}
#[launch]
async fn rocket() -> _ {
 // Allow all origins

    let allowed_methods: HashSet<Method> = vec![
        Method::Get,
        Method::Post,
        Method::Put,
        Method::Delete,
        Method::Options, // Important for preflight requests
        Method::Patch,
        Method::Head,
    ].into_iter().collect();

    let cors = CorsOptions {
        allowed_origins: AllowedOrigins::all(),
        //allowed_methods,  // Use the HashSet of methods here
        allowed_headers: AllowedHeaders::all(),
        allow_credentials: true,
        ..Default::default()
    }
    .to_cors()
    .expect("Failed to create CORS fairing");

    let client = RpcClient::new_with_commitment(SERVER_URL.to_string(), CommitmentConfig::finalized());

    let mongo_client_options = ClientOptions::parse("mongodb+srv://mohamedredarahmani20:<password>@cluster0.yf03kut.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
").await.unwrap();
    let mongodb_client = Client::with_options(mongo_client_options).unwrap();
    let vulnerabilities_data = load_vulnerabilities("/home/reda/SRKWallet/solana-wallet/src/compiled_risk_data.json");    // Create the shared state for Solana RPC and MongoDB
    let solana_state = SolanaState {
        client: Mutex::new(client),
        mongodb: mongodb_client,
        vulnerabilities: Mutex::new(vulnerabilities_data),
    };
    // Initialize rate limiter with a maximum of 10 requests per minute
    let rate_limiter = RateLimiter {
        requests: Mutex::new(HashMap::new()),
        max_requests: 5,         // Max 10 requests
        window_seconds: 60,       // Time window of 60 seconds
    };
    rocket::build()
        .manage(solana_state)
        .manage(rate_limiter) 
        .attach(cors)
        .mount("/", routes![cluster_info, supply, keygen, balance, airdrop, transfer, signup , signin , signout , wormhole_transfer, vote , approve_will, get_transactions_by_signer,get_user, add_or_update_will, transfer_confirmation, get_public_key_by_email, freeze_account ])
}
