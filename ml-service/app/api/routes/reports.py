from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from typing import List, Dict, Any, Optional
from datetime import datetime
import os
import tempfile
import json
from ...services.report_generator import report_generator

router = APIRouter()

@router.post("/inventory-report")
async def generate_inventory_report(
    background_tasks: BackgroundTasks,
    products: List[Dict[str, Any]],
    report_title: Optional[str] = "Inventory Report"
):
    """
    Generate comprehensive inventory report PDF
    """
    try:
        # Create temporary file for PDF
        temp_dir = tempfile.gettempdir()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"inventory_report_{timestamp}.pdf"
        output_path = os.path.join(temp_dir, filename)
        
        # Generate the report
        report_path = report_generator.generate_inventory_report(products, output_path)
        
        # Schedule cleanup after response
        background_tasks.add_task(cleanup_file, report_path)
        
        return FileResponse(
            path=report_path,
            filename=filename,
            media_type='application/pdf',
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@router.post("/prediction-report")
async def generate_prediction_report(
    background_tasks: BackgroundTasks,
    predictions: List[Dict[str, Any]],
    report_title: Optional[str] = "Prediction Report"
):
    """
    Generate ML prediction analysis report PDF
    """
    try:
        # Create temporary file for PDF
        temp_dir = tempfile.gettempdir()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"prediction_report_{timestamp}.pdf"
        output_path = os.path.join(temp_dir, filename)
        
        # Generate the report
        report_path = report_generator.generate_prediction_report(predictions, output_path)
        
        # Schedule cleanup after response
        background_tasks.add_task(cleanup_file, report_path)
        
        return FileResponse(
            path=report_path,
            filename=filename,
            media_type='application/pdf',
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@router.post("/sales-report")
async def generate_sales_report(
    background_tasks: BackgroundTasks,
    sales_data: List[Dict[str, Any]],
    date_range: Dict[str, str],
    report_title: Optional[str] = "Sales Report"
):
    """
    Generate sales analysis report PDF
    """
    try:
        # Create temporary file for PDF
        temp_dir = tempfile.gettempdir()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"sales_report_{timestamp}.pdf"
        output_path = os.path.join(temp_dir, filename)
        
        # Generate the report (implement sales report generator)
        report_path = report_generator.generate_sales_report(sales_data, date_range, output_path)
        
        # Schedule cleanup after response
        background_tasks.add_task(cleanup_file, report_path)
        
        return FileResponse(
            path=report_path,
            filename=filename,
            media_type='application/pdf',
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@router.post("/compliance-report")
async def generate_compliance_report(
    background_tasks: BackgroundTasks,
    products: List[Dict[str, Any]],
    compliance_data: List[Dict[str, Any]],
    report_title: Optional[str] = "Compliance Report"
):
    """
    Generate regulatory compliance report for agricultural products
    """
    try:
        # Create temporary file for PDF
        temp_dir = tempfile.gettempdir()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"compliance_report_{timestamp}.pdf"
        output_path = os.path.join(temp_dir, filename)
        
        # Generate the report (implement compliance report generator)
        report_path = report_generator.generate_compliance_report(
            products, compliance_data, output_path
        )
        
        # Schedule cleanup after response
        background_tasks.add_task(cleanup_file, report_path)
        
        return FileResponse(
            path=report_path,
            filename=filename,
            media_type='application/pdf',
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@router.get("/sample-inventory-report")
async def generate_sample_inventory_report(background_tasks: BackgroundTasks):
    """
    Generate a sample inventory report with mock data
    """
    try:
        # Mock data for demonstration
        sample_products = [
            {
                "id": "1",
                "name": "ChlorMax 480 EC",
                "sku": "PEST-001",
                "quantity": 45,
                "minStockLevel": 50,
                "unitPrice": 45.99,
                "category": {"name": "Pesticides"},
                "productType": "INSECTICIDE"
            },
            {
                "id": "2", 
                "name": "NPK 20-20-20",
                "sku": "FERT-001",
                "quantity": 200,
                "minStockLevel": 100,
                "unitPrice": 22.50,
                "category": {"name": "Fertilizers"},
                "productType": "FERTILIZER"
            },
            {
                "id": "3",
                "name": "WeedOut Glyphosate",
                "sku": "HERB-001", 
                "quantity": 15,
                "minStockLevel": 40,
                "unitPrice": 35.75,
                "category": {"name": "Herbicides"},
                "productType": "HERBICIDE"
            }
        ]
        
        # Create temporary file for PDF
        temp_dir = tempfile.gettempdir()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"sample_inventory_report_{timestamp}.pdf"
        output_path = os.path.join(temp_dir, filename)
        
        # Generate the report
        report_path = report_generator.generate_inventory_report(sample_products, output_path)
        
        # Schedule cleanup after response
        background_tasks.add_task(cleanup_file, report_path)
        
        return FileResponse(
            path=report_path,
            filename=filename,
            media_type='application/pdf',
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sample report generation failed: {str(e)}")

@router.get("/sample-prediction-report")
async def generate_sample_prediction_report(background_tasks: BackgroundTasks):
    """
    Generate a sample prediction report with mock data
    """
    try:
        # Mock prediction data
        sample_predictions = [
            {
                "product_id": "PEST-001",
                "predicted_demand": 180.5,
                "confidence": 0.85,
                "product_type": "PESTICIDE"
            },
            {
                "product_id": "FERT-001", 
                "predicted_demand": 220.3,
                "confidence": 0.92,
                "product_type": "FERTILIZER"
            },
            {
                "product_id": "HERB-001",
                "predicted_demand": 95.7,
                "confidence": 0.78,
                "product_type": "HERBICIDE"
            }
        ]
        
        # Create temporary file for PDF
        temp_dir = tempfile.gettempdir()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"sample_prediction_report_{timestamp}.pdf"
        output_path = os.path.join(temp_dir, filename)
        
        # Generate the report
        report_path = report_generator.generate_prediction_report(sample_predictions, output_path)
        
        # Schedule cleanup after response
        background_tasks.add_task(cleanup_file, report_path)
        
        return FileResponse(
            path=report_path,
            filename=filename,
            media_type='application/pdf',
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sample report generation failed: {str(e)}")

def cleanup_file(file_path: str):
    """Clean up temporary files after response"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Failed to cleanup file {file_path}: {e}")

@router.get("/health")
async def health_check():
    """Health check endpoint for report service"""
    return {
        "status": "healthy",
        "service": "report_generator",
        "timestamp": datetime.now().isoformat()
    }
