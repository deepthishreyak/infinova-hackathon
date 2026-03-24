# Invoice Financing Smart Contract

## Overview

The smart contract manages the lifecycle of invoice tokenization, financing, and settlement on Algorand.

## Functions

### create_invoice
- Creates a new invoice ASA
- Stores invoice metadata in contract state
- Parameters: amount, buyer, due_date, metadata_hash

### finance_invoice
- Executes atomic transaction: pay supplier + transfer ASA to financier
- Updates invoice status to "Financed"

### settle_invoice
- Allows buyer to pay financier on due date
- Marks invoice as "Settled"

### deposit_pool
- Allows investors to deposit Algo into liquidity pool

## State

### Global State
- invoice_count: Total number of invoices
- pool_balance: Total liquidity in pool

### Local State (per invoice)
- supplier: Invoice supplier address
- buyer: Invoice buyer address
- amount: Invoice amount
- due_date: Due date timestamp
- status: 0=Pending, 1=Financed, 2=Settled
- financier: Address of financier
- asa_id: Asset ID of invoice token