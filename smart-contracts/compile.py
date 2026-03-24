"""
Smart Contract Compilation and Deployment Script
Compiles PyTeal contracts to TEAL and deploys to Algorand
"""

import os
import sys
from pyteal import compileTeal, Mode
from invoice_contract import approval_program, clear_state_program

def compile_and_save_contracts():
    """Compile PyTeal contracts to TEAL files"""
    
    print("=" * 60)
    print("Compiling Smart Contracts...")
    print("=" * 60)
    
    try:
        # Create output directory
        os.makedirs('compiled', exist_ok=True)
        
        # Compile approval program
        print("\n[1/2] Compiling approval program...")
        approval_teal = compileTeal(approval_program(), Mode.Application, version=10)
        with open('compiled/invoice_approval.teal', 'w') as f:
            f.write(approval_teal)
        print("✓ Approval program compiled: compiled/invoice_approval.teal")
        print(f"  Lines: {len(approval_teal.splitlines())}")
        
        # Compile clear state program
        print("\n[2/2] Compiling clear state program...")
        clearstate_teal = compileTeal(clear_state_program(), Mode.Application, version=10)
        with open('compiled/invoice_clearstate.teal', 'w') as f:
            f.write(clearstate_teal)
        print("✓ Clear state program compiled: compiled/invoice_clearstate.teal")
        print(f"  Lines: {len(clearstate_teal.splitlines())}")
        
        print("\n" + "=" * 60)
        print("✓ Compilation Successful!")
        print("=" * 60)
        print("\nNext steps:")
        print("1. Review TEAL files in compiled/ directory")
        print("2. Deploy using algokit or custom deployment script")
        print("3. Update backend with contract app IDs")
        print("\n")
        
        return True
        
    except Exception as e:
        print(f"\n✗ Compilation Failed!")
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    success = compile_and_save_contracts()
    sys.exit(0 if success else 1)
