import React, { useState, useEffect } from "react";
import { ConfigProvider, theme } from "antd";
export default function TimeLine(value) {
  const [htmlContent, setHtmlContent] = useState("");
  const { Event, dataServer } = value;
  
  
  useEffect(() => {
    const fetchHtmlContent = async () => {
      try {
        const response = await fetch("/test.html"); // Adjust the path accordingly
        const htmlString = await response.text();
        // 直接在 useEffect 中使用 replace 方法进行替换
        const modifiedHtml1 = htmlString.replace(
          new RegExp("ParentEventID", "g"),
          String(Event)
        );
        const modifiedHtml2 = modifiedHtml1.replace(
          new RegExp("http://localhost:3000", "g"),
          String(dataServer)
        );
        setHtmlContent(modifiedHtml2);
      } catch (error) {
        console.error("Error fetching HTML content:", error);
      }
    };

    fetchHtmlContent();
  }, [Event, dataServer]);

  return (
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
      <iframe
        style={{ width: "100vw", height: "100vh", border: "none" }}
        title="Embedded HTML"
        srcDoc={htmlContent}
      />
    </ConfigProvider>
  );
}
