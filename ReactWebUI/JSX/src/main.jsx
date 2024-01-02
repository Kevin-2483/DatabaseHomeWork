import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ConfigProvider, theme } from "antd";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: "#e6c06c",
        colorInfo: "#e6c06c",
        colorSuccess: "#a4f97b",
        colorError: "#f96da1",
        colorWarning: "#f7f976",
        colorLink: "#66fdf3",
        colorBgBase: "#222222",
        wireframe: false,
      },
      algorithm: theme.darkAlgorithm,
    }}
  >
    <React.StrictMode>
      <App />
    </React.StrictMode>
    
  </ConfigProvider>
);
