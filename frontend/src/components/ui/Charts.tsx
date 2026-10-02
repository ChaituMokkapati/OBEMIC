'use client';

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  LineController
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  LineController
);

interface DonutProps {
  assigned: number;
  pending: number;
}

export const AttainmentDonutChart: React.FC<DonutProps> = ({ assigned, pending }) => {
  const data = {
    labels: ['Assigned', 'Pending'],
    datasets: [
      {
        data: [assigned, pending],
        backgroundColor: ['#1e73be', '#cf2c31'],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false },
    },
  };

  return <Doughnut data={data} options={options} />;
};

interface BarChartProps {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | any;
    borderColor?: string;
    borderWidth?: number;
    type?: 'bar' | 'line';
    borderDash?: number[];
    pointStyle?: string;
    pointRadius?: number;
    pointBackgroundColor?: string;
    fill?: boolean;
    borderRadius?: any;
  }[];
  maxScale?: number;
  yTitle?: string;
}

export const AttainmentBarChart: React.FC<BarChartProps> = ({ labels, datasets, maxScale = 3.0, yTitle = '3-point Scale' }) => {
  const data: any = {
    labels,
    datasets: datasets.map(ds => ({
      ...ds,
      // Apply gradient if needed, simplified for React-Chartjs to static colors if not using canvas context manually
    }))
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      y: {
        beginAtZero: true,
        max: maxScale,
        ticks: {
          stepSize: 0.50,
          color: '#64748b'
        },
        grid: {
          color: 'rgba(226, 232, 240, 0.6)',
          borderDash: [5, 5],
          drawBorder: false
        },
        title: {
          display: !!yTitle,
          text: yTitle,
          color: '#475569'
        }
      },
      x: {
        ticks: { color: '#64748b' },
        grid: { display: false, drawBorder: false }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#64748b', usePointStyle: true, boxWidth: 12 }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        padding: 12,
        cornerRadius: 8
      }
    }
  };

  return <Bar data={data} options={options} />;
};
