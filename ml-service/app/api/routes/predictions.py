from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from datetime import datetime, timedelta
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
import random

router = APIRouter()

# Agricultural prediction models
class AgriculturalPredictor:
    def __init__(self):
        self.demand_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.price_model = LinearRegression()
        self.seasonal_factors = {
            'PESTICIDE': {'spring': 1.5, 'summer': 1.8, 'fall': 1.2, 'winter': 0.8},
            'FERTILIZER': {'spring': 2.0, 'summer': 1.3, 'fall': 1.1, 'winter': 0.9},
            'HERBICIDE': {'spring': 1.7, 'summer': 1.4, 'fall': 1.0, 'winter': 0.7},
            'FUNGICIDE': {'spring': 1.3, 'summer': 1.6, 'fall': 1.1, 'winter': 0.8}
        }

    def get_season(self, date: datetime) -> str:
        month = date.month
        if month in [3, 4, 5]:
            return 'spring'
        elif month in [6, 7, 8]:
            return 'summer'
        elif month in [9, 10, 11]:
            return 'fall'
        else:
            return 'winter'

    def predict_demand(self, product_type: str, historical_sales: List[float],
                      weather_factors: Dict, crop_calendar: Dict) -> Dict:
        # Simulate ML prediction with realistic agricultural factors
        base_demand = np.mean(historical_sales) if historical_sales else 100

        # Seasonal adjustment
        current_season = self.get_season(datetime.now())
        seasonal_factor = self.seasonal_factors.get(product_type, {}).get(current_season, 1.0)

        # Weather impact
        rainfall = weather_factors.get('rainfall', 50)
        temperature = weather_factors.get('temperature', 25)

        weather_impact = 1.0
        if product_type == 'PESTICIDE':
            # Higher rainfall increases pest pressure
            weather_impact = 1.0 + (rainfall - 50) * 0.01
        elif product_type == 'FERTILIZER':
            # Moderate rainfall is good for fertilizer application
            weather_impact = 1.0 + max(0, (50 - abs(rainfall - 50)) * 0.005)

        # Crop calendar impact
        planting_season = crop_calendar.get('is_planting_season', False)
        harvest_season = crop_calendar.get('is_harvest_season', False)

        crop_impact = 1.0
        if planting_season and product_type in ['FERTILIZER', 'PESTICIDE']:
            crop_impact = 1.3
        elif harvest_season and product_type == 'PESTICIDE':
            crop_impact = 0.8

        # Calculate final prediction
        predicted_demand = base_demand * seasonal_factor * weather_impact * crop_impact

        # Add some realistic variance
        variance = predicted_demand * 0.1
        predicted_demand += random.uniform(-variance, variance)

        confidence = min(0.95, max(0.6, 0.8 + random.uniform(-0.1, 0.1)))

        return {
            'predicted_demand': round(predicted_demand, 2),
            'confidence': round(confidence, 3),
            'factors': {
                'seasonal_factor': round(seasonal_factor, 2),
                'weather_impact': round(weather_impact, 2),
                'crop_calendar_impact': round(crop_impact, 2),
                'base_demand': round(base_demand, 2)
            }
        }

predictor = AgriculturalPredictor()

@router.get("/demand/{product_id}")
async def predict_demand(product_id: str, days_ahead: int = 30, product_type: str = "PESTICIDE"):
    """
    Predict demand for a specific agricultural product
    """
    try:
        # Simulate historical sales data (in real implementation, fetch from database)
        historical_sales = [random.uniform(80, 200) for _ in range(30)]

        # Simulate weather data
        weather_factors = {
            'rainfall': random.uniform(20, 100),
            'temperature': random.uniform(15, 35),
            'humidity': random.uniform(40, 80)
        }

        # Simulate crop calendar data
        current_month = datetime.now().month
        crop_calendar = {
            'is_planting_season': current_month in [3, 4, 5, 10, 11],
            'is_harvest_season': current_month in [9, 10, 11, 12, 1, 2],
            'peak_growth_season': current_month in [6, 7, 8]
        }

        # Get prediction
        prediction = predictor.predict_demand(
            product_type.upper(),
            historical_sales,
            weather_factors,
            crop_calendar
        )

        return {
            "product_id": product_id,
            "prediction_type": "demand",
            "days_ahead": days_ahead,
            "predicted_demand": prediction['predicted_demand'],
            "confidence": prediction['confidence'],
            "prediction_date": datetime.now().isoformat(),
            "weather_conditions": weather_factors,
            "crop_calendar": crop_calendar,
            "prediction_factors": prediction['factors'],
            "recommendations": generate_recommendations(product_type, prediction)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

def generate_recommendations(product_type: str, prediction: Dict) -> List[str]:
    """Generate actionable recommendations based on prediction"""
    recommendations = []
    demand = prediction['predicted_demand']
    confidence = prediction['confidence']

    if confidence > 0.8:
        if demand > 150:
            recommendations.append(f"High demand predicted for {product_type.lower()}. Consider increasing stock levels.")
            recommendations.append("Monitor competitor pricing and adjust accordingly.")
        elif demand < 80:
            recommendations.append(f"Low demand predicted for {product_type.lower()}. Consider promotional activities.")
            recommendations.append("Review inventory levels to avoid overstocking.")
    else:
        recommendations.append("Prediction confidence is moderate. Monitor market conditions closely.")

    # Seasonal recommendations
    season = predictor.get_season(datetime.now())
    if season == 'spring' and product_type in ['FERTILIZER', 'PESTICIDE']:
        recommendations.append("Spring season: Peak demand period for agricultural inputs.")
    elif season == 'winter':
        recommendations.append("Winter season: Consider offering storage solutions and early bird discounts.")

    return recommendations

@router.get("/reorder/{product_id}")
async def predict_reorder_point(product_id: str, product_type: str = "PESTICIDE", current_stock: int = 50):
    """
    Predict optimal reorder point for agricultural products
    """
    try:
        # Simulate demand variability and lead time for agricultural products
        avg_daily_demand = random.uniform(5, 15)
        demand_std = avg_daily_demand * 0.3

        # Agricultural products often have longer lead times due to regulatory requirements
        lead_time_days = random.randint(7, 21)

        # Safety stock calculation considering seasonality
        season = predictor.get_season(datetime.now())
        seasonal_factor = predictor.seasonal_factors.get(product_type.upper(), {}).get(season, 1.0)

        # Higher safety stock during peak seasons
        safety_stock = max(10, int(avg_daily_demand * lead_time_days * 0.5 * seasonal_factor))

        # Reorder point calculation
        reorder_point = int((avg_daily_demand * lead_time_days) + safety_stock)

        # Economic order quantity (simplified)
        annual_demand = avg_daily_demand * 365
        holding_cost_rate = 0.2  # 20% of product cost
        ordering_cost = 50  # Fixed cost per order

        # Simplified EOQ calculation
        eoq = int(np.sqrt((2 * annual_demand * ordering_cost) / (holding_cost_rate * 100)))

        # Adjust for minimum order quantities common in agricultural products
        min_order_qty = 50 if product_type.upper() in ['PESTICIDE', 'HERBICIDE'] else 100
        recommended_order_qty = max(eoq, min_order_qty)

        # Calculate days until reorder needed
        days_until_reorder = max(0, (current_stock - reorder_point) / avg_daily_demand)

        return {
            "product_id": product_id,
            "prediction_type": "reorder_point",
            "current_stock": current_stock,
            "recommended_reorder_point": reorder_point,
            "recommended_order_quantity": recommended_order_qty,
            "confidence": round(random.uniform(0.75, 0.9), 3),
            "lead_time_days": lead_time_days,
            "safety_stock": safety_stock,
            "avg_daily_demand": round(avg_daily_demand, 2),
            "days_until_reorder": round(days_until_reorder, 1),
            "seasonal_factor": seasonal_factor,
            "prediction_date": datetime.now().isoformat(),
            "recommendations": generate_reorder_recommendations(
                current_stock, reorder_point, days_until_reorder, product_type
            )
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reorder prediction failed: {str(e)}")

def generate_reorder_recommendations(current_stock: int, reorder_point: int,
                                   days_until_reorder: float, product_type: str) -> List[str]:
    """Generate reorder recommendations"""
    recommendations = []

    if current_stock <= reorder_point:
        recommendations.append("⚠️ URGENT: Stock level is at or below reorder point. Place order immediately.")
        if product_type.upper() in ['PESTICIDE', 'HERBICIDE', 'FUNGICIDE']:
            recommendations.append("Consider expedited shipping due to regulatory approval times.")
    elif days_until_reorder <= 7:
        recommendations.append("📋 Stock level is approaching reorder point. Prepare purchase order.")
        recommendations.append("Verify supplier availability and lead times.")
    elif days_until_reorder <= 14:
        recommendations.append("📊 Monitor stock levels closely. Reorder needed within 2 weeks.")

    # Seasonal recommendations
    season = predictor.get_season(datetime.now())
    if season == 'spring':
        recommendations.append("🌱 Spring season: Consider increasing order quantities for peak demand.")
    elif season == 'winter':
        recommendations.append("❄️ Winter season: Good time for bulk purchasing at better rates.")

    return recommendations

@router.get("/price-optimization/{product_id}")
async def predict_optimal_price(product_id: str):
    """
    Predict optimal pricing for maximum profit
    """
    return {
        "product_id": product_id,
        "prediction_type": "price_optimization",
        "current_price": 99.99,
        "recommended_price": 104.99,
        "expected_demand_change": -0.05,
        "expected_profit_increase": 0.12,
        "confidence": 0.72,
        "prediction_date": datetime.now().isoformat()
    }

@router.post("/batch-predictions")
async def batch_predictions(product_ids: List[str], prediction_types: List[str]):
    """
    Get batch predictions for multiple products
    """
    results = []
    for product_id in product_ids:
        for pred_type in prediction_types:
            if pred_type == "demand":
                result = await predict_demand(product_id)
            elif pred_type == "reorder":
                result = await predict_reorder_point(product_id)
            elif pred_type == "price":
                result = await predict_optimal_price(product_id)
            else:
                continue
            results.append(result)
    
    return {
        "batch_predictions": results,
        "total_predictions": len(results),
        "timestamp": datetime.now().isoformat()
    }
