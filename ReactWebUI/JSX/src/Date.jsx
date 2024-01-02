import React, { useState, useEffect } from "react";
import { Table, message, Button, ConfigProvider, theme } from "antd";
import PropTypes from "prop-types";
export default function Date(props) {
  const { dataServer } = props;
  const [token, setToken] = useState(() => {
    // 从Cookie中读取令牌
    const storedToken = document.cookie.replace(
      /(?:(?:^|.*;\s*)jwt\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    return storedToken || "";
  });

  const [refreshData, setRefreshData] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState([]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          // 可以在这里添加其他头部信息
        };
        const requestOptions = {
          method: "GET",
          headers: headers,
        };
        const response = await fetch(
          dataServer + "/datemanagement",
          requestOptions
        );
        const jsonData = await response.json();

        setDataSource(
          jsonData.dateResults.map((item) => ({
            ...item,
            key: item.dateID.toString(), // 将 backgroundID 转为字符串，确保 key 为字符串类型
          }))
        );
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshData, dataServer]);

  const columns = [
    {
      title: "dateID",
      dataIndex: "dateID",
      key: "dateID",
      fixed: "left",
    },
    {
      title: "year",
      dataIndex: "year",
      key: "year",
    },
    {
      title: "month",
      dataIndex: "month",
      key: "month",
    },
    {
      title: "day",
      dataIndex: "day",
      key: "day",
    },
    {
      title: "hour",
      dataIndex: "hour",
      key: "hour",
    },
    {
      title: "minute",
      dataIndex: "minute",
      key: "minute",
    },
    {
      title: "second",
      dataIndex: "second",
      key: "second",
    },
    {
      title: "millisecond",
      dataIndex: "millisecond",
      key: "millisecond",
    },
    {
      title: "display_date",
      dataIndex: "display_date",
      key: "display_date",
    },
    {
      title: "format",
      dataIndex: "format",
      key: "format",
    },
    {
      title: "Action",
      dataIndex: "",
      key: "x",
      fixed: "right",
      render: (record) => (
        <Button type="link" onClick={() => onDel(record.key)}>
          Delete
        </Button>
      ),
    },
  ];
  if (error) {
    message.error("Token验证失败,正在返回登录", 5);
    return <p>Error: {error.message}</p>;
  }
  const onDel = async (values) => {
    console.log("Success:", values);
    try {
      const response = await fetch(dataServer+"/deleteRecord", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 指定请求体类型为 JSON
          // 如果有其他头部信息，也可以在这里添加
        },
        body: JSON.stringify({
          id: values,
          table: "date",
        }), // 将数据转换为JSON格式
      });
      const jsonData = await response.json();
      console.log(jsonData);
      if (!jsonData.success) {
        message.error(jsonData.error, 7);

        throw new Error(jsonData.error);
      } else {
        message.success("删除成功", 3);
        setRefreshData(!refreshData);
      }
    } catch (error) {
      console.error("Error during POST request:", error);
    }
  };

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
      <Table
        dataSource={dataSource}
        columns={columns}
        scroll={{
          x: 2000,
        }}
        pagination={{ position: ["topRight"] }}
        style={{ margin: "10px 10px 10px 10px" }}
      />
    </ConfigProvider>
  );
}
Date.propTypes = {
  dataServer: PropTypes.string.isRequired,
};