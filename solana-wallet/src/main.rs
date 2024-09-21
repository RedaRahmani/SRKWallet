use chrono::{DateTime, Utc};
use clap::{Parser, Subcommand};
use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    account::from_account, clock::Clock, commitment_config::CommitmentConfig, native_token::lamports_to_sol, sysvar,
};

#[derive(Parser)]
#[clap(author, version, about, long_about=None)]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    ClusterInfo,
    Supply,
}

const SERVER_URL: &str = "https://api.devnet.solana.com";

fn get_cluster_info(client: &RpcClient) {
    println!("Fetching cluster version...");
    match client.get_version() {
        Ok(version) => {
            println!("Node version retrieved successfully: {}", version.solana_core);
            println!("Fetching clock account...");
            match client.get_account_with_commitment(&sysvar::clock::id(), CommitmentConfig::finalized()) {
                Ok(result) => {
                    println!("Clock account retrieved successfully.");
                    let (slot, timestamp) = match result.value {
                        Some(clock_account) => {
                            let clock: Clock = from_account(&clock_account).expect("Failed to convert clock account");
                            (result.context.slot, clock.unix_timestamp) // This should be i64
                        }
                        None => {
                            eprintln!("Clock account not found.");
                            return;
                        }
                    };

                    // Directly create DateTime<Utc> from timestamp
                    let datetime = DateTime::<Utc>::from_timestamp(timestamp, 0); // No Option here

                    // Now we can safely call format on datetime
                    println!("Cluster version: {}", version.solana_core);
                    println!("Block: {}, Time: {}", slot, datetime.map_or("N/A".to_string(), |dt| dt.format("%Y-%m-%d %H:%M:%S").to_string()));

                }
                Err(err) => {
                    eprintln!("Failed to fetch clock account: {}", err);
                }
            }
        }
        Err(err) => {
            eprintln!("Failed to get cluster version: {}", err);
        }
    }
}

fn get_supply(client: &RpcClient) {
    let supply_response = client.supply().unwrap();
    let supply = supply_response.value;
    println!(
        "Total supply: {} SOL\nCirculating: {} SOL\nNon-Circulating: {} SOL",
        lamports_to_sol(supply.total),
        lamports_to_sol(supply.circulating),
        lamports_to_sol(supply.non_circulating)
    );
}

fn main() {
    let cli = Cli::parse();
    let client = RpcClient::new(SERVER_URL);

    match &cli.command {
        Some(Commands::ClusterInfo) => {
            println!("Get cluster info");
            get_cluster_info(&client);
        }
        Some(Commands::Supply) => {
            println!("Get supply info");
            get_supply(&client);
        }
        None => {
            println!("No command provided.");
        }
    }
}
