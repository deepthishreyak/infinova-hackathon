"""
Production-Ready AI Risk Scoring Service for Invoice Financing
Evaluates invoice risk and suggests optimal interest rates
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import numpy as np
import uvicorn
import logging
from datetime import datetime

# ============================================================================
# LOGGING SETUP
# ============================================================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

app = FastAPI(
    title="Invoice Financing Risk Scoring API",
    description="AI-powered risk assessment and interest rate recommendation",
    version="1.0.0"
)

# Enable CORS for all origins (restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# MODELS
# ============================================================================

class InvoiceData(BaseModel):
    """Input model for risk scoring"""
    supplier_history_score: float = Field(
        ..., 
        ge=0, 
        le=1, 
        description="Supplier historical performance (0-1)"
    )
    invoice_amount: float = Field(
        ..., 
        gt=0, 
        description="Invoice amount in microAlgos"
    )
    due_date_days: int = Field(
        ..., 
        gt=0, 
        description="Days until invoice due date"
    )
    supplier_credit_score: float = Field(
        default=70, 
        ge=0, 
        le=100,
        description="Supplier credit score (0-100)"
    )
    transaction_count: Optional[int] = Field(
        default=1,
        description="Number of past transactions"
    )
    default_history: Optional[int] = Field(
        default=0,
        description="Number of past defaults"
    )
    payment_timeliness: Optional[float] = Field(
        default=0.5,
        ge=0,
        le=1,
        description="On-time payment ratio (0-1)"
    )


class RiskScoreResponse(BaseModel):
    """Output model for risk scoring"""
    risk_score: float
    risk_level: str
    interest_rate_bps: int  # basis points (1 bps = 0.01%)
    interest_rate_percent: float
    recommended_funding_amount: float
    confidence: float
    factors: dict
    timestamp: str


class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    service: str
    version: str


# ============================================================================
# RISK SCORING LOGIC
# ============================================================================

class RiskScorer:
    """Advanced risk scoring algorithm for invoices"""
    
    # Weights for different factors (should sum to 1.0)
    WEIGHTS = {
        'supplier_history': 0.25,
        'credit_score': 0.20,
        'invoice_amount': 0.15,
        'payment_timeliness': 0.15,
        'due_date': 0.10,
        'transaction_count': 0.10,
        'default_history': 0.05
    }
    
    # Risk thresholds
    RISK_THRESHOLDS = {
        'low': 0.70,      # >= 0.70
        'medium': 0.40,   # >= 0.40
        'high': 0.0       # < 0.40
    }
    
    # Interest rate mapping (in basis points)
    INTEREST_RATES = {
        'low': 500,      # 5%
        'medium': 1000,  # 10%
        'high': 2000     # 20%
    }
    
    @staticmethod
    def score_supplier_history(score: float) -> tuple[float, dict]:
        """Score based on supplier history (0-1 scale)"""
        if score > 0.85:
            component_score = 0.95
            factor = "Excellent supplier history"
        elif score > 0.70:
            component_score = 0.80
            factor = "Good supplier history"
        elif score > 0.50:
            component_score = 0.60
            factor = "Average supplier history"
        elif score > 0.30:
            component_score = 0.30
            factor = "Poor supplier history"
        else:
            component_score = 0.10
            factor = "Very poor supplier history"
        
        return component_score, {'score': score, 'factor': factor}
    
    @staticmethod
    def score_credit_score(credit_score: float) -> tuple[float, dict]:
        """Score based on credit score (0-100 scale)"""
        # Normalize to 0-1 scale
        normalized = credit_score / 100.0
        
        if credit_score > 90:
            component_score = 0.95
            factor = "Excellent credit score"
        elif credit_score > 75:
            component_score = 0.80
            factor = "Good credit score"
        elif credit_score > 60:
            component_score = 0.60
            factor = "Fair credit score"
        elif credit_score >= 50:
            component_score = 0.40
            factor = "Poor credit score"
        else:
            component_score = 0.10
            factor = "Very poor credit score"
        
        return component_score, {'score': credit_score, 'factor': factor}
    
    @staticmethod
    def score_invoice_amount(amount: float) -> tuple[float, dict]:
        """Score based on invoice amount (larger amounts = higher risk)"""
        # Risk increases with amount
        if amount < 10000:  # < 0.01 ALGO
            component_score = 0.95
            factor = "Very low amount"
        elif amount < 100000:  # < 0.1 ALGO
            component_score = 0.85
            factor = "Low amount"
        elif amount < 1000000:  # < 1 ALGO
            component_score = 0.70
            factor = "Medium amount"
        elif amount < 10000000:  # < 10 ALGO
            component_score = 0.50
            factor = "High amount"
        else:
            component_score = 0.30
            factor = "Very high amount"
        
        return component_score, {'amount': amount, 'factor': factor}
    
    @staticmethod
    def score_payment_timeliness(timeliness: float) -> tuple[float, dict]:
        """Score based on on-time payment ratio (0-1 scale)"""
        if timeliness > 0.95:
            component_score = 0.95
            factor = "Excellent payment timeliness"
        elif timeliness > 0.80:
            component_score = 0.80
            factor = "Good payment timeliness"
        elif timeliness > 0.60:
            component_score = 0.60
            factor = "Average payment timeliness"
        elif timeliness > 0.30:
            component_score = 0.30
            factor = "Poor payment timeliness"
        else:
            component_score = 0.10
            factor = "Very poor payment timeliness"
        
        return component_score, {'timeliness': timeliness, 'factor': factor}
    
    @staticmethod
    def score_due_date(due_date_days: int) -> tuple[float, dict]:
        """Score based on invoice due date (shorter terms = higher risk)"""
        if due_date_days > 120:
            component_score = 0.95
            factor = "Long payment term"
        elif due_date_days > 90:
            component_score = 0.85
            factor = "Good payment term"
        elif due_date_days > 60:
            component_score = 0.70
            factor = "Medium payment term"
        elif due_date_days > 30:
            component_score = 0.60
            factor = "Short payment term"
        else:
            component_score = 0.40
            factor = "Very short payment term"
        
        return component_score, {'days': due_date_days, 'factor': factor}
    
    @staticmethod
    def score_transaction_count(count: int) -> tuple[float, dict]:
        """Score based on transaction history"""
        if count > 50:
            component_score = 0.95
            factor = "Very extensive transaction history"
        elif count > 20:
            component_score = 0.85
            factor = "Extensive transaction history"
        elif count > 10:
            component_score = 0.70
            factor = "Good transaction history"
        elif count > 5:
            component_score = 0.55
            factor = "Some transaction history"
        elif count > 0:
            component_score = 0.40
            factor = "Limited transaction history"
        else:
            component_score = 0.10
            factor = "No transaction history"
        
        return component_score, {'count': count, 'factor': factor}
    
    @staticmethod
    def score_default_history(defaults: int) -> tuple[float, dict]:
        """Score based on default history (more defaults = more risky)"""
        if defaults == 0:
            component_score = 1.0
            factor = "No defaults"
        elif defaults == 1:
            component_score = 0.70
            factor = "One default"
        elif defaults == 2:
            component_score = 0.40
            factor = "Two defaults"
        else:
            component_score = 0.10
            factor = f"Multiple defaults ({defaults})"
        
        return component_score, {'defaults': defaults, 'factor': factor}
    
    @classmethod
    def calculate_risk_score(cls, data: InvoiceData) -> RiskScoreResponse:
        """Calculate overall risk score"""
        
        # Score individual components
        supplier_history_score, supplier_factor = cls.score_supplier_history(
            data.supplier_history_score
        )
        credit_score, credit_factor = cls.score_credit_score(
            data.supplier_credit_score
        )
        amount_score, amount_factor = cls.score_invoice_amount(
            data.invoice_amount
        )
        timeliness_score, timeliness_factor = cls.score_payment_timeliness(
            data.payment_timeliness
        )
        due_date_score, due_date_factor = cls.score_due_date(
            data.due_date_days
        )
        transaction_score, transaction_factor = cls.score_transaction_count(
            data.transaction_count or 1
        )
        default_score, default_factor = cls.score_default_history(
            data.default_history or 0
        )
        
        # Calculate weighted average
        overall_score = (
            supplier_history_score * cls.WEIGHTS['supplier_history'] +
            credit_score * cls.WEIGHTS['credit_score'] +
            amount_score * cls.WEIGHTS['invoice_amount'] +
            timeliness_score * cls.WEIGHTS['payment_timeliness'] +
            due_date_score * cls.WEIGHTS['due_date'] +
            transaction_score * cls.WEIGHTS['transaction_count'] +
            default_score * cls.WEIGHTS['default_history']
        )
        
        # Clamp to 0-1
        overall_score = max(0, min(1, overall_score))
        
        # Determine risk level
        if overall_score >= cls.RISK_THRESHOLDS['low']:
            risk_level = 'Low'
        elif overall_score >= cls.RISK_THRESHOLDS['medium']:
            risk_level = 'Medium'
        else:
            risk_level = 'High'
        
        # Get interest rate
        interest_rate_bps = cls.INTEREST_RATES[risk_level.lower()]
        interest_rate_percent = interest_rate_bps / 10000.0
        
        # Calculate recommended funding amount (reduce for higher risk)
        risk_adjustment = 1 - (1 - overall_score) * 0.35
        recommended_funding = data.invoice_amount * risk_adjustment
        
        # Calculate confidence based on data completeness
        confidence = 0.75 + (0.25 * min(data.transaction_count or 1, 10) / 10)
        
        return RiskScoreResponse(
            risk_score=round(overall_score, 4),
            risk_level=risk_level,
            interest_rate_bps=interest_rate_bps,
            interest_rate_percent=round(interest_rate_percent, 4),
            recommended_funding_amount=round(recommended_funding),
            confidence=round(confidence, 4),
            factors={
                'supplier_history': supplier_factor,
                'credit_score': credit_factor,
                'invoice_amount': amount_factor,
                'payment_timeliness': timeliness_factor,
                'due_date': due_date_factor,
                'transaction_count': transaction_factor,
                'default_history': default_factor,
            },
            timestamp=datetime.utcnow().isoformat() + 'Z'
        )


# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/", tags=["Health"])
@app.get("/api/health", tags=["Health"])
async def health_check() -> HealthCheckResponse:
    """Health check endpoint"""
    logger.info("Health check requested")
    return HealthCheckResponse(
        status="healthy",
        service="Invoice Risk Scoring API",
        version="1.0.0"
    )


@app.post("/api/score", response_model=RiskScoreResponse, tags=["Scoring"])
async def score_invoice(data: InvoiceData) -> RiskScoreResponse:
    """
    Calculate risk score and recommend interest rate for an invoice
    
    Returns:
    - risk_score: Normalized score (0-1)
    - risk_level: Low/Medium/High
    - interest_rate_bps: Interest rate in basis points
    - recommended_funding_amount: Max recommended funding
    - confidence: Confidence in the score (0-1)
    - factors: Breakdown of scoring factors
    """
    try:
        logger.info(f"Scoring invoice with amount: {data.invoice_amount}")
        response = RiskScorer.calculate_risk_score(data)
        logger.info(f"Risk score calculated: {response.risk_level} ({response.risk_score})")
        return response
    except Exception as e:
        logger.error(f"Error calculating risk score: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/score", response_model=RiskScoreResponse, tags=["Scoring"])
async def score_invoice_legacy(data: InvoiceData) -> RiskScoreResponse:
    """Legacy endpoint for backward compatibility"""
    return await score_invoice(data)


@app.get("/api/info", tags=["Info"])
async def get_info():
    """Get API information"""
    return {
        "name": "Invoice Financing Risk Scoring API",
        "version": "1.0.0",
        "description": "AI-powered risk assessment for invoice financing",
        "endpoints": {
            "health": "/api/health",
            "score": "/api/score",
            "info": "/api/info"
        }
    }


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    return HTTPException(status_code=400, detail=str(exc))


# ============================================================================
# SERVER STARTUP
# ============================================================================

if __name__ == "__main__":
    print("""
╔════════════════════════════════════════════════════════════════╗
║      Invoice Financing Risk Scoring Service Started            ║
║                                                                ║
║  Service: http://localhost:8000                                ║
║  API Docs: http://localhost:8000/docs                          ║
║  OpenAPI Schema: http://localhost:8000/openapi.json            ║
║                                                                ║
║  Endpoints:                                                    ║
║  POST /api/score   - Score an invoice                          ║
║  GET  /api/health  - Health check                              ║
║  GET  /api/info    - API information                           ║
║════════════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
        risk = "High"
        interest_rate = 0.20

    return {
        "risk_score": score,
        "risk_level": risk,
        "suggested_interest_rate": interest_rate
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)