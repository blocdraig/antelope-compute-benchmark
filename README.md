# Antelope Compute Benchmark

This script will obtain a list of API endpoints from the producerjson contract on chain.

It will then run a series of compute benchmarks on each API endpoint using a list of payloads.

The results will be stored in a SQLite database.

## Installation

This script requires Node.js >=20 and Yarn or NPM.

Clone the repository with `git clone` and `cd` into the directory.

Install the required packages with `yarn install --frozen-lockfile` or `npm ci`.

## Usage

Put your json payload files in the `payloads` directory.

A payload is a json file with an array of actions.  
Each payload should have a unique name and the file should have a `.json` extension.  
Payloads should result in a successful transaction otherwise the benchmark will fail.

Example payload.json
```json
[
  {
    "account": "contract",
    "name": "action",
    "authorization": [
      {
        "actor": "account",
        "permission": "permission"
      }
    ],
    "data": {
      ...
    }
  },
  ...
]
```

Then run the script with `yarn run start` or `npm run start`.

## Environment Variables

Optionally you can set the default RPC_URL used to get the list of APIs in a `.env` file.

## Output

The results will be stored in a SQLite database in the `database` directory.  
The **results** table will have the following columns:
- id: primary key
- payload: name of the payload file without the extension
- api: url of the API
- cpu_usage_us: integer (null if the transaction failed)
- created_at: timestamp the test was run

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
