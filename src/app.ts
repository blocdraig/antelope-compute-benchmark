import fs from 'fs';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { Action, APIClient, Transaction } from '@wharfkit/antelope';
import { ContractKit } from '@wharfkit/contract';

const RPC_URL = process.env.RPC_URL || 'https://wax.greymass.com';

const client = new APIClient({
  url: RPC_URL,
});

const contractKit = new ContractKit({
  client,
});
console.log('ContractKit initialized successfully.');

contractKit
  .load('producerjson')
  .then(async (contract) => {
    const rows = await contract.table('producerjson').all();

    if (!rows.length) {
      console.log('No producers found');
      return;
    }

    const db = await open({
      filename: 'database/benchmark.db',
      driver: sqlite3.Database,
    });
    console.log('Database connected successfully.');

    await db.migrate();

    const apis = new Set();

    for (const row of rows) {
      const data = JSON.parse(row.json);
      const nodes = data.nodes;
      const filtered = nodes.filter(
        (node: any) =>
          node.node_type === 'query' && node.features.includes('chain-api')
      );
      for (const node of filtered) {
        apis.add(node.ssl_endpoint);
      }
    }

    console.log(`${apis.size} Endpoints found`);

    const expireSeconds = 300;
    const info = await client.v1.chain.get_info();
    const header = info.getTransactionHeader(expireSeconds);

    const payloads: Map<string, any> = new Map();
    fs.readdirSync('./payloads').map((file) => {
      if (!file.endsWith('.json')) {
        return;
      }
      payloads.set(
        file.replace('.json', ''),
        JSON.parse(fs.readFileSync(`./payloads/${file}`, 'utf-8'))
      );
    });

    for (const [key, payload] of payloads) {
      console.log(`Processing payload: ${key}`);

      for (const action of payload) {
        if (!contractKit.abiCache.cache.has(action.account)) {
          await contractKit.abiCache.getAbi(action.account);
        }
      }

      const actions: Action[] = payload.map((action: any) => {
        return Action.from(
          action,
          contractKit.abiCache.cache.get(action.account)
        );
      });

      const transaction = Transaction.from({
        ...header,
        actions,
      });

      for (const api of apis) {
        process.stdout.write('.');
        const res = await client.v1.chain
          .compute_transaction(transaction)
          .catch((err) => {
            console.error(`Error processing payload: ${key} on API: ${api}`);
            console.error(err);
            return null;
          });

        await db.run(
          'INSERT INTO results (payload, api, cpu_usage_us, created_at) VALUES (?, ?, ?, ?)',
          [
            key,
            api,
            res?.processed.receipt.cpu_usage_us || null,
            info.head_block_time.toDate(),
          ]
        );
      }
    }
  })
  .catch(console.error);
