import { Form, Input, message, ConfigProvider, theme } from "antd";
import PropTypes from "prop-types";
import React, { useState } from "react";


export default function UpdateFrom({ AdminID, dataServer ,form2 }) {
  
  const [token, setToken] = useState(() => {
    // 从Cookie中读取令牌
    const storedToken = document.cookie.replace(
      /(?:(?:^|.*;\s*)jwt\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    return storedToken || "";
  });

  const onFinish = async (values) => {
    
    
    
    console.log("Success:", values);
    try {
      const response = await fetch(dataServer+"/update-admin-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 指定请求体类型为 JSON
          // 如果有其他头部信息，也可以在这里添加
        },
        body: JSON.stringify({
          adminid: AdminID,
          updateAdminName: values.updateAdminName,
          updateAdminContact: values.updateAdminContact,
        }), // 将数据转换为JSON格式
      });
      const jsonData = await response.json();
      console.log(jsonData);
      if (!jsonData.success) {
        message.error("更新信息时发生错误", 7);

        throw new Error("Network response was not ok");
      } else {
        message.success("信息更新成功", 3);
      }
    } catch (error) {
      console.error("Error during POST request:", error);
    }
  };
  const onFinishFailed = (errorInfo) => {
    message.error(errorInfo);
    console.log("Failed:", errorInfo);
  };

  return (
    <>
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
        <Form
          form={form2}
          name="update_form"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="新的名称"
            name="updateAdminName"
            rules={[
              {
                required: true,
                message: "Please input your username!",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="新的联系方式"
            name="updateAdminContact"
            rules={[
              {
                required: true,
                message: "Please input your Contact!",
              },
            ]}
          >
            <Input />
          </Form.Item>

          {/* <Form.Item>
          <Button type="primary" htmlType="submit">
            更新信息
          </Button>
        </Form.Item> */}
        </Form>
      </ConfigProvider>
    </>
  );
}

UpdateFrom.propTypes = {
  AdminID: PropTypes.string.isRequired,
  dataServer: PropTypes.string.isRequired,
  form2: PropTypes.func.isRequired,
};
