import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import React from 'react';
import ReactDOM from 'react-dom/client';
import Report from '../components/Report';
import type { SimulationSummary, SimulationSnapshot } from '../types';

export async function generateReport(summary: SimulationSummary, snapshots: SimulationSnapshot[]): Promise<void> {
    const reportElement = document.createElement('div');
    // Styles to render the element off-screen
    reportElement.style.position = 'absolute';
    reportElement.style.left = '-9999px';
    reportElement.style.top = '0';
    reportElement.style.width = '1024px'; // A fixed width for consistent PDF layout
    document.body.appendChild(reportElement);

    const root = ReactDOM.createRoot(reportElement);
    // Use React.createElement to render the component programmatically
    root.render(React.createElement(Report, { summary, snapshots }));

    // A short delay to ensure all content, especially charts, are fully rendered before capture
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
        const reportContent = reportElement.querySelector('#simulation-report-content');
        if (!reportContent) {
            throw new Error("Report content not found");
        }
        
        const canvas = await html2canvas(reportContent as HTMLElement, {
            scale: 2, // Higher scale for better resolution
            useCORS: true,
            backgroundColor: '#0a0e14',
            logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`Simulation-Report-${new Date().toISOString().slice(0, 10)}.pdf`);

    } catch (error) {
        console.error("Failed to generate report:", error);
    } finally {
        // Cleanup: unmount the component and remove the temporary element
        root.unmount();
        document.body.removeChild(reportElement);
    }
}
