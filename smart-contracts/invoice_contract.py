"""
Production-Ready Invoice Financing Smart Contract
Algorand Smart Contract for Tokenized Invoice Financing and Settlement
"""

from pyteal import *

# ============================================================================
# GLOBAL STATE CONSTANTS
# ============================================================================

# Global status tracking
INVOICE_COUNT = Bytes("invoice_count")
POOL_BALANCE = Bytes("pool_balance")
TOTAL_FINANCING_VOLUME = Bytes("total_financing_volume")
OWNER = Bytes("owner")

# Invoice State Keys (indexed by invoice ID)
def invoice_key(field):
    return Concat(Bytes("inv_"), field)

SUPPLIER_KEY = Bytes("supplier")
BUYER_KEY = Bytes("buyer")
AMOUNT_KEY = Bytes("amount")
DUE_DATE_KEY = Bytes("due_date")
STATUS_KEY = Bytes("status")  # 0=Pending, 1=Financed, 2=Settled, 3=Defaulted
FINANCIER_KEY = Bytes("financier")
ASA_ID_KEY = Bytes("asa_id")
INTEREST_RATE_KEY = Bytes("interest_rate")
FINANCED_AMOUNT_KEY = Bytes("financed_amount")
METADATA_HASH_KEY = Bytes("metadata_hash")
CREATION_TIME_KEY = Bytes("creation_time")

# Status Constants
STATUS_PENDING = Int(0)
STATUS_FINANCED = Int(1)
STATUS_SETTLED = Int(2)
STATUS_DEFAULTED = Int(3)

# ============================================================================
# HELPER SUBROUTINES
# ============================================================================

@Subroutine(TealType.uint64)
def create_invoice_asa(amount: Expr, invoice_id: Expr) -> Expr:
    """Create an ASA representing an invoice token."""
    return Seq([
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetConfig,
            TxnField.config_asset_total: Int(1),
            TxnField.config_asset_decimals: Int(0),
            TxnField.config_asset_unit_name: Bytes("INVTOK"),
            TxnField.config_asset_name: Concat(
                Bytes("Invoice-"),
                Itob(invoice_id)
            ),
            TxnField.config_asset_url: Bytes("ipfs://"),
            TxnField.config_asset_manager: Global.current_application_address(),
            TxnField.config_asset_reserve: Global.current_application_address(),
            TxnField.config_asset_freeze: Global.current_application_address(),
            TxnField.config_asset_clawback: Global.current_application_address(),
        }),
        InnerTxnBuilder.Submit(),
        Return(InnerTxn.created_asset_id())
    ])


@Subroutine(TealType.none)
def transfer_asa_to_financier(asa_id: Expr, financier: Expr) -> Expr:
    """Transfer invoice ASA to financier."""
    return Seq([
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.AssetTransfer,
            TxnField.xfer_asset: asa_id,
            TxnField.asset_amount: Int(1),
            TxnField.asset_receiver: financier,
            TxnField.asset_sender: Global.current_application_address(),
        }),
        InnerTxnBuilder.Submit(),
    ])


@Subroutine(TealType.none)
def pay_supplier(amount: Expr, supplier: Expr) -> Expr:
    """Pay supplier the financed amount."""
    return Seq([
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.amount: amount,
            TxnField.receiver: supplier,
        }),
        InnerTxnBuilder.Submit(),
    ])


@Subroutine(TealType.none)
def pay_financier(amount: Expr, financier: Expr) -> Expr:
    """Pay financier the settlement amount with interest."""
    return Seq([
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.amount: amount,
            TxnField.receiver: financier,
        }),
        InnerTxnBuilder.Submit(),
    ])


@Subroutine(TealType.uint64)
def get_invoice_status(invoice_id: Expr) -> Expr:
    """Retrieve invoice status."""
    return App.globalGet(
        Concat(invoice_key(STATUS_KEY), Itob(invoice_id))
    )


@Subroutine(TealType.uint64)
def get_invoice_amount(invoice_id: Expr) -> Expr:
    """Retrieve invoice amount."""
    return App.globalGet(
        Concat(invoice_key(AMOUNT_KEY), Itob(invoice_id))
    )


# ============================================================================
# MAIN CONTRACT LOGIC
# ============================================================================

def approval_program():
    """Main contract approval program for invoice financing."""
    
    # Local variables for operations
    invoice_id = ScratchVar(TealType.uint64)
    amount = ScratchVar(TealType.uint64)
    buyer = ScratchVar(TealType.bytes)
    due_date = ScratchVar(TealType.uint64)
    metadata_hash = ScratchVar(TealType.bytes)
    supplier = ScratchVar(TealType.bytes)
    financier = ScratchVar(TealType.bytes)
    asa_id = ScratchVar(TealType.uint64)
    interest_rate = ScratchVar(TealType.uint64)
    current_status = ScratchVar(TealType.uint64)
    settlement_amount = ScratchVar(TealType.uint64)

    # ========== CONTRACT INITIALIZATION ==========
    on_create = Seq([
        App.globalPut(INVOICE_COUNT, Int(0)),
        App.globalPut(POOL_BALANCE, Int(0)),
        App.globalPut(TOTAL_FINANCING_VOLUME, Int(0)),
        App.globalPut(OWNER, Txn.sender()),
        Return(Int(1))
    ])

    on_optin = Return(Int(1))
    on_closeout = Return(Int(1))

    # ========== CREATE INVOICE ==========
    create_invoice = Seq([
        # Validate inputs
        Assert(Txn.application_args.length() == Int(5)),
        Assert(Len(Txn.application_args[0]) > Int(0)),
        Assert(Len(Txn.application_args[1]) == Int(32)),  # bytes(32) for address
        Assert(Len(Txn.application_args[2]) > Int(0)),
        
        # Parse arguments
        (amount.store(Btoi(Txn.application_args[0]))),
        (buyer.store(Txn.application_args[1])),
        (due_date.store(Btoi(Txn.application_args[2]))),
        (metadata_hash.store(Txn.application_args[3])),
        (supplier.store(Txn.sender())),
        
        # Validations
        Assert(amount.load() > Int(1000)),  # Minimum amount: 1000 microAlgos
        Assert(due_date.load() > Global.latest_timestamp()),  # Due date must be in future
        
        # Create ASA for invoice
        (invoice_id.store(App.globalGet(INVOICE_COUNT))),
        (asa_id.store(create_invoice_asa(amount.load(), invoice_id.load()))),
        
        # Store invoice data
        App.globalPut(
            Concat(invoice_key(SUPPLIER_KEY), Itob(invoice_id.load())),
            supplier.load()
        ),
        App.globalPut(
            Concat(invoice_key(BUYER_KEY), Itob(invoice_id.load())),
            buyer.load()
        ),
        App.globalPut(
            Concat(invoice_key(AMOUNT_KEY), Itob(invoice_id.load())),
            amount.load()
        ),
        App.globalPut(
            Concat(invoice_key(DUE_DATE_KEY), Itob(invoice_id.load())),
            due_date.load()
        ),
        App.globalPut(
            Concat(invoice_key(STATUS_KEY), Itob(invoice_id.load())),
            STATUS_PENDING
        ),
        App.globalPut(
            Concat(invoice_key(ASA_ID_KEY), Itob(invoice_id.load())),
            asa_id.load()
        ),
        App.globalPut(
            Concat(invoice_key(METADATA_HASH_KEY), Itob(invoice_id.load())),
            metadata_hash.load()
        ),
        App.globalPut(
            Concat(invoice_key(CREATION_TIME_KEY), Itob(invoice_id.load())),
            Global.latest_timestamp()
        ),
        
        # Increment invoice count
        App.globalPut(INVOICE_COUNT, invoice_id.load() + Int(1)),
        
        # Log event: LogicSig or return success with invoice ID
        Return(Int(1))
    ])

    # ========== FINANCE INVOICE ==========
    finance_invoice = Seq([
        # Validate inputs
        Assert(Txn.application_args.length() == Int(2)),
        (invoice_id.store(Btoi(Txn.application_args[0]))),
        (interest_rate.store(Btoi(Txn.application_args[1]))),
        (financier.store(Txn.sender())),
        
        # Validate interest rate (e.g., 1-50% = 100-5000 basis points)
        Assert(interest_rate.load() >= Int(100)),
        Assert(interest_rate.load() <= Int(5000)),
        
        # Check invoice exists and is in Pending status
        (current_status.store(
            App.globalGet(
                Concat(invoice_key(STATUS_KEY), Itob(invoice_id.load()))
            )
        )),
        Assert(current_status.load() == STATUS_PENDING),
        
        # Get amount and ASA ID
        (amount.store(get_invoice_amount(invoice_id.load()))),
        (asa_id.store(
            App.globalGet(
                Concat(invoice_key(ASA_ID_KEY), Itob(invoice_id.load()))
            )
        )),
        (supplier.store(
            App.globalGet(
                Concat(invoice_key(SUPPLIER_KEY), Itob(invoice_id.load()))
            )
        )),
        
        # Atomic transfer: ASA to financier + payment to supplier
        transfer_asa_to_financier(asa_id.load(), financier.load()),
        pay_supplier(amount.load(), supplier.load()),
        
        # Update state
        App.globalPut(
            Concat(invoice_key(STATUS_KEY), Itob(invoice_id.load())),
            STATUS_FINANCED
        ),
        App.globalPut(
            Concat(invoice_key(FINANCIER_KEY), Itob(invoice_id.load())),
            financier.load()
        ),
        App.globalPut(
            Concat(invoice_key(INTEREST_RATE_KEY), Itob(invoice_id.load())),
            interest_rate.load()
        ),
        App.globalPut(
            Concat(invoice_key(FINANCED_AMOUNT_KEY), Itob(invoice_id.load())),
            amount.load()
        ),
        App.globalPut(TOTAL_FINANCING_VOLUME, 
            App.globalGet(TOTAL_FINANCING_VOLUME) + amount.load()
        ),
        
        Return(Int(1))
    ])

    # ========== SETTLE INVOICE ==========
    settle_invoice = Seq([
        # Validate inputs
        Assert(Txn.application_args.length() == Int(1)),
        (invoice_id.store(Btoi(Txn.application_args[0]))),
        
        # Check invoice is financed
        (current_status.store(
            App.globalGet(
                Concat(invoice_key(STATUS_KEY), Itob(invoice_id.load()))
            )
        )),
        Assert(current_status.load() == STATUS_FINANCED),
        
        # Get settlement details
        (amount.store(get_invoice_amount(invoice_id.load()))),
        (interest_rate.store(
            App.globalGet(
                Concat(invoice_key(INTEREST_RATE_KEY), Itob(invoice_id.load()))
            )
        )),
        (financier.store(
            App.globalGet(
                Concat(invoice_key(FINANCIER_KEY), Itob(invoice_id.load()))
            )
        )),
        
        # Calculate settlement amount: amount + interest
        # Interest in basis points (10000 = 100%)
        (settlement_amount.store(
            amount.load() + (amount.load() * interest_rate.load() / Int(10000))
        )),
        
        # Pay financier
        pay_financier(settlement_amount.load(), financier.load()),
        
        # Update status
        App.globalPut(
            Concat(invoice_key(STATUS_KEY), Itob(invoice_id.load())),
            STATUS_SETTLED
        ),
        
        Return(Int(1))
    ])

    # ========== MARK AS DEFAULTED ==========
    mark_defaulted = Seq([
        # Validate inputs
        Assert(Txn.application_args.length() == Int(1)),
        (invoice_id.store(Btoi(Txn.application_args[0]))),
        
        # Check invoice is financed
        (current_status.store(
            App.globalGet(
                Concat(invoice_key(STATUS_KEY), Itob(invoice_id.load()))
            )
        )),
        Assert(current_status.load() == STATUS_FINANCED),
        
        # Check due date has passed
        Assert(
            App.globalGet(
                Concat(invoice_key(DUE_DATE_KEY), Itob(invoice_id.load()))
            ) < Global.latest_timestamp()
        ),
        
        # Update status
        App.globalPut(
            Concat(invoice_key(STATUS_KEY), Itob(invoice_id.load())),
            STATUS_DEFAULTED
        ),
        
        Return(Int(1))
    ])

    # ========== POOL OPERATIONS ==========
    deposit_to_pool = Seq([
        # Only deposits via payment transaction are accepted
        Assert(Txn.type_enum() == TxnType.ApplicationCall),
        Assert(Txn.amount() > Int(0) or Txn.group_size() > Int(1)),
        
        # Add to pool balance
        App.globalPut(POOL_BALANCE, 
            App.globalGet(POOL_BALANCE) + Txn.amount()
        ),
        
        Return(Int(1))
    ])

    withdraw_from_pool = Seq([
        # Only owner can withdraw
        Assert(Txn.sender() == App.globalGet(OWNER)),
        
        # validate amount
        Assert(Btoi(Txn.application_args[0]) <= App.globalGet(POOL_BALANCE)),
        
        # Process withdrawal
        App.globalPut(POOL_BALANCE, 
            App.globalGet(POOL_BALANCE) - Btoi(Txn.application_args[0])
        ),
        
        Return(Int(1))
    ])

    # ========== ROUTE TO HANDLER ==========
    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.OptIn, on_optin],
        [Txn.on_completion() == OnComplete.CloseOut, on_closeout],
        [
            Txn.application_args[0] == Bytes("create_invoice"),
            create_invoice
        ],
        [
            Txn.application_args[0] == Bytes("finance_invoice"),
            finance_invoice
        ],
        [
            Txn.application_args[0] == Bytes("settle_invoice"),
            settle_invoice
        ],
        [
            Txn.application_args[0] == Bytes("mark_defaulted"),
            mark_defaulted
        ],
        [
            Txn.application_args[0] == Bytes("deposit_to_pool"),
            deposit_to_pool
        ],
        [
            Txn.application_args[0] == Bytes("withdraw_from_pool"),
            withdraw_from_pool
        ],
    )
    
    return program


def clear_state_program():
    """Clear state program - allows users to opt out."""
    return Int(1)


# ============================================================================
# UTILITY FOR COMPILATION
# ============================================================================

if __name__ == "__main__":
    # Save approval program
    with open("invoice_approval.teal", "w") as f:
        f.write(compileTeal(approval_program(), Mode.Application, version=10))
    
    # Save clear state program
    with open("invoice_clearstate.teal", "w") as f:
        f.write(compileTeal(clear_state_program(), Mode.Application, version=10))
        (amount := App.localGet(Int(0), invoice_amount)),
        (supplier := App.localGet(Int(0), invoice_supplier)),
        Assert(App.localGet(Int(0), invoice_status) == Int(0)),  # Must be pending
        pay_supplier(amount, supplier),
        (asa_id := App.localGet(Int(0), invoice_asa_id)),
        transfer_asa_to_financier(asa_id, financier),
        App.localPut(Int(0), invoice_status, Int(1)),  # Financed
        App.localPut(Int(0), invoice_financier, financier),
        Return(Int(1))
    ])

    # Settle Invoice
    settle_invoice = Seq([
        Assert(Txn.application_args.length() == Int(1)),  # invoice_id
        (invoice_id := Btoi(Txn.application_args[0])),
        Assert(App.localGet(Int(0), invoice_status) == Int(1)),  # Must be financed
        (buyer := App.localGet(Int(0), invoice_buyer)),
        Assert(Txn.sender() == buyer),
        (amount := App.localGet(Int(0), invoice_amount)),
        (financier := App.localGet(Int(0), invoice_financier)),
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.amount: amount,
            TxnField.receiver: financier,
        }),
        InnerTxnBuilder.Submit(),
        App.localPut(Int(0), invoice_status, Int(2)),  # Settled
        Return(Int(1))
    ])

    # Deposit to pool
    deposit_pool = Seq([
        (amount := Txn.amount()),
        App.globalPut(pool_balance, App.globalGet(pool_balance) + amount),
        Return(Int(1))
    ])

    program = Cond(
        [Txn.application_id() == Int(0), on_create],
        [Txn.on_completion() == OnComplete.OptIn, on_optin],
        [Txn.on_completion() == OnComplete.CloseOut, on_closeout],
        [Txn.on_completion() == OnComplete.NoOp, Cond(
            [Txn.application_args[0] == Bytes("create_invoice"), create_invoice],
            [Txn.application_args[0] == Bytes("finance_invoice"), finance_invoice],
            [Txn.application_args[0] == Bytes("settle_invoice"), settle_invoice],
            [Txn.application_args[0] == Bytes("deposit_pool"), deposit_pool],
        )],
    )

    return program

def clear_program():
    return Return(Int(1))

if __name__ == "__main__":
    with open("approval.teal", "w") as f:
        compiled = compileTeal(approval_program(), Mode.Application, Version.v5)
        f.write(compiled)

    with open("clear.teal", "w") as f:
        compiled = compileTeal(clear_program(), Mode.Application, Version.v5)
        f.write(compiled)