from fastapi import APIRouter, Request
from typing import Dict, Any

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])

@router.post("/payment", response_model=Dict[str, Any])
async def payment_webhook(request: Request):
    """
    Webhook for payment events
    """
    body = await request.json()
    
    # Process payment webhook
    # In a real application, you would verify the webhook signature
    # and handle payment events accordingly
    
    return {
        "success": True,
        "message": "Payment webhook received"
    }

@router.post("/blockchain", response_model=Dict[str, Any])
async def blockchain_webhook(request: Request):
    """
    Webhook for blockchain events
    """
    body = await request.json()
    
    # Process blockchain webhook
    # In a real application, you would verify the webhook signature
    # and handle blockchain events accordingly
    
    return {
        "success": True,
        "message": "Blockchain webhook received"
    } 