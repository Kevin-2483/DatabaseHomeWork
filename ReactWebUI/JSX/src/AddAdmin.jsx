import {  Form, Input, message, ConfigProvider, theme } from "antd";
import React, { useState } from "react";
import PropTypes from "prop-types";
export default function AddAdmin(props) {
  const { dataServer, form3 } = props;
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
      const response = await fetch(dataServer+"/add-new-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 指定请求体类型为 JSON
          // 如果有其他头部信息，也可以在这里添加
        },
        body: JSON.stringify({
          adminId: values.newAdminId,
          adminName: values.updateAdminName,
          adminContact: values.updateAdminContact,
          adminPassword: values.newAdminPassword,
        }), // 将数据转换为JSON格式
      });
      const jsonData = await response.json();
      console.log(jsonData);
      if (!jsonData.success) {
        message.error(jsonData.message, 7);

        throw new Error(jsonData.message);
      } else {
        message.success("信息添加成功", 3);
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
          form={form3}
          name="AddAdmin"
          autoComplete="off"
          style={{
            maxWidth: 600,
          }}
          layout="vertical"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
        >
          <Form.Item
            label="管理员ID"
            name="newAdminId"
            rules={[
              {
                required: true,
                message: "Please input a New AdminId!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="名称"
            name="newAdminName"
            rules={[
              {
                required: true,
                message: "Please input a New Admin Name!",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="联系方式"
            name="newAdminContact"
            rules={[
              {
                required: true,
                message: "Please input a new Admin Contact!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="密码"
            name="newAdminPassword"
            rules={[
              {
                required: true,
                message: "Please input a password!",
              },
            ]}
          >
            <Input.Password />
          </Form.Item>

          {/* Field */}
          <Form.Item
            label="确认密码"
            name="confirmNewAdminPassword"
            dependencies={["newAdminPassword"]}
            rules={[
              {
                required: true,
                message: "Please confirm password!",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newAdminPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("The new password that you entered do not match!")
                  );
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          {/* <Form.Item>
          <Button type="primary" htmlType="submit">
            添加
          </Button>
        </Form.Item> */}
        </Form>
      </ConfigProvider>
    </>
  );
}

AddAdmin.propTypes = {
  dataServer: PropTypes.string.isRequired, // 你可以根据实际情况更改类型
  form3: PropTypes.func.isRequired,
};
