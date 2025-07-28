from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from reportlab.graphics.charts.barcharts import VerticalBarChart
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import io
import base64
from typing import Dict, List, Any
import os

class AgriculturalReportGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            textColor=colors.darkgreen
        )
        self.heading_style = ParagraphStyle(
            'CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.darkblue
        )
        
    def generate_inventory_report(self, products: List[Dict], output_path: str) -> str:
        """Generate comprehensive inventory report for agricultural products"""
        doc = SimpleDocTemplate(output_path, pagesize=A4)
        story = []
        
        # Title
        title = Paragraph("Agricultural Inventory Report", self.title_style)
        story.append(title)
        story.append(Spacer(1, 12))
        
        # Report metadata
        report_date = datetime.now().strftime("%B %d, %Y")
        metadata = Paragraph(f"Generated on: {report_date}", self.styles['Normal'])
        story.append(metadata)
        story.append(Spacer(1, 20))
        
        # Executive Summary
        story.append(Paragraph("Executive Summary", self.heading_style))
        
        total_products = len(products)
        total_value = sum(p.get('quantity', 0) * p.get('unitPrice', 0) for p in products)
        low_stock_items = len([p for p in products if p.get('quantity', 0) <= p.get('minStockLevel', 0)])
        
        summary_data = [
            ['Metric', 'Value'],
            ['Total Products', str(total_products)],
            ['Total Inventory Value', f"${total_value:,.2f}"],
            ['Low Stock Items', str(low_stock_items)],
            ['Report Date', report_date]
        ]
        
        summary_table = Table(summary_data)
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 20))
        
        # Product Categories Analysis
        story.append(Paragraph("Product Categories", self.heading_style))
        
        # Group products by category
        category_stats = {}
        for product in products:
            category = product.get('category', {}).get('name', 'Unknown')
            if category not in category_stats:
                category_stats[category] = {'count': 0, 'value': 0}
            category_stats[category]['count'] += 1
            category_stats[category]['value'] += product.get('quantity', 0) * product.get('unitPrice', 0)
        
        category_data = [['Category', 'Products', 'Total Value']]
        for category, stats in category_stats.items():
            category_data.append([category, str(stats['count']), f"${stats['value']:,.2f}"])
        
        category_table = Table(category_data)
        category_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(category_table)
        story.append(Spacer(1, 20))
        
        # Low Stock Alert
        if low_stock_items > 0:
            story.append(Paragraph("⚠️ Low Stock Alerts", self.heading_style))
            
            low_stock_products = [p for p in products if p.get('quantity', 0) <= p.get('minStockLevel', 0)]
            low_stock_data = [['Product Name', 'Current Stock', 'Min Level', 'Status']]
            
            for product in low_stock_products[:10]:  # Show top 10
                status = "CRITICAL" if product.get('quantity', 0) == 0 else "LOW"
                low_stock_data.append([
                    product.get('name', 'Unknown'),
                    str(product.get('quantity', 0)),
                    str(product.get('minStockLevel', 0)),
                    status
                ])
            
            low_stock_table = Table(low_stock_data)
            low_stock_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.red),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.lightyellow),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(low_stock_table)
            story.append(Spacer(1, 20))
        
        # Recommendations
        story.append(Paragraph("Recommendations", self.heading_style))
        recommendations = self._generate_inventory_recommendations(products)
        for rec in recommendations:
            story.append(Paragraph(f"• {rec}", self.styles['Normal']))
            story.append(Spacer(1, 6))
        
        # Build PDF
        doc.build(story)
        return output_path
    
    def generate_prediction_report(self, predictions: List[Dict], output_path: str) -> str:
        """Generate ML prediction analysis report"""
        doc = SimpleDocTemplate(output_path, pagesize=A4)
        story = []
        
        # Title
        title = Paragraph("Agricultural Demand Prediction Report", self.title_style)
        story.append(title)
        story.append(Spacer(1, 12))
        
        # Report metadata
        report_date = datetime.now().strftime("%B %d, %Y")
        metadata = Paragraph(f"Generated on: {report_date}", self.styles['Normal'])
        story.append(metadata)
        story.append(Spacer(1, 20))
        
        # Prediction Summary
        story.append(Paragraph("Prediction Summary", self.heading_style))
        
        avg_confidence = np.mean([p.get('confidence', 0) for p in predictions])
        high_demand_products = len([p for p in predictions if p.get('predicted_demand', 0) > 150])
        
        summary_text = f"""
        This report analyzes demand predictions for {len(predictions)} agricultural products.
        Average prediction confidence: {avg_confidence:.1%}
        Products with high demand forecast: {high_demand_products}
        
        The predictions consider seasonal factors, weather conditions, and crop calendar data
        to provide accurate demand forecasts for agricultural inputs.
        """
        
        story.append(Paragraph(summary_text, self.styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Predictions Table
        story.append(Paragraph("Detailed Predictions", self.heading_style))
        
        pred_data = [['Product', 'Predicted Demand', 'Confidence', 'Recommendation']]
        for pred in predictions[:15]:  # Show top 15
            recommendation = "Increase Stock" if pred.get('predicted_demand', 0) > 150 else "Monitor"
            pred_data.append([
                pred.get('product_id', 'Unknown'),
                f"{pred.get('predicted_demand', 0):.0f}",
                f"{pred.get('confidence', 0):.1%}",
                recommendation
            ])
        
        pred_table = Table(pred_data)
        pred_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightblue),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(pred_table)
        story.append(Spacer(1, 20))
        
        # Build PDF
        doc.build(story)
        return output_path
    
    def _generate_inventory_recommendations(self, products: List[Dict]) -> List[str]:
        """Generate actionable inventory recommendations"""
        recommendations = []
        
        # Analyze stock levels
        low_stock_count = len([p for p in products if p.get('quantity', 0) <= p.get('minStockLevel', 0)])
        if low_stock_count > 0:
            recommendations.append(f"Immediate action required: {low_stock_count} products are below minimum stock levels")
        
        # Analyze by category
        pesticide_products = [p for p in products if 'pesticide' in p.get('category', {}).get('name', '').lower()]
        if pesticide_products:
            avg_stock = np.mean([p.get('quantity', 0) for p in pesticide_products])
            if avg_stock < 100:
                recommendations.append("Pesticide inventory levels are low - consider bulk purchasing for better rates")
        
        # Seasonal recommendations
        current_month = datetime.now().month
        if current_month in [3, 4, 5]:  # Spring
            recommendations.append("Spring season: Increase fertilizer and pesticide stock levels for peak demand")
        elif current_month in [9, 10, 11]:  # Fall
            recommendations.append("Fall season: Prepare for harvest-related product demand")
        
        # General recommendations
        recommendations.append("Implement automated reorder alerts for critical agricultural products")
        recommendations.append("Consider supplier diversification to reduce supply chain risks")
        
        return recommendations

# Global instance
report_generator = AgriculturalReportGenerator()
