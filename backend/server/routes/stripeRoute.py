import stripe
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from urllib.parse import quote
from datetime import datetime, timedelta
import os

router = APIRouter()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

@router.post("/stripe/create-checkout-session")
async def create_checkout_session(request: Request):
    try:
        data = await request.json()
        print("📦 Incoming request body:", data)

        user_id = data.get("userId")
        plan = data.get("plan")
        price = data.get("price")
        email = data.get("email")
        cycle = data.get("cycle")

        if not user_id or not plan or price is None or not email or not cycle:
            print("❌ Missing fields:", {
                "userId": user_id,
                "plan": plan,
                "price": price,
                "email": email,
                "cycle": cycle
            })
            return JSONResponse(status_code=400, content={"error": "Missing required fields"})

        # ✅ Encode all values for the URL
        encoded_success_url = (
            f"https://cineit-frontend.onrender.com/#/success" #if deploy render frontend
            f"?userId={quote(user_id)}"
            f"&plan={quote(plan)}"
            f"&cycle={quote(cycle)}"
            f"&price={quote(str(price))}"
            f"&email={quote(email)}"
        )

        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            customer_email=email,
            line_items=[{
                "price_data": {
                    "currency": "sgd",
                    "product_data": {"name": f"{plan}"},
                    "unit_amount": int(price * 100),
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=encoded_success_url,
            cancel_url="http://localhost:3000/#/home/subscription",
            metadata={"userId": user_id, "plan": plan, "email": email}
        )

        print("✅ Stripe session created:", session.url)

        # ✅ Manually update subscription record
        subscription_collection = request.app.state.user_db["subscription"]

        duration = timedelta(days=30) if cycle.lower() == "monthly" else timedelta(days=365)
        now = datetime.utcnow()
        next_payment = (now + duration).strftime("%d %B %Y")
        expires_on = (now + duration).strftime("%d %B %Y")

        subscription_collection.update_one(
            {"userId": user_id},
            {
                "$set": {
                    "plan": plan,
                    "price": price,
                    "cycle": cycle,
                    "isActive": True,
                    "wasCancelled": False,    # ✅ Reset
                    "isTrial": False,         # ✅ Clear trial status
                    "nextPayment": next_payment,
                    "expiresOn": expires_on,
                }
            },
            upsert=True
        )

        print("✅ Subscription manually updated for", user_id)

        return JSONResponse({"url": session.url})

    except Exception as e:
        print("🔥 Stripe checkout session creation failed:", str(e))
        return JSONResponse(status_code=500, content={"error": str(e)})