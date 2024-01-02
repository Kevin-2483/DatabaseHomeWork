import React, { useState } from "react";
import { message, Form, Input, ConfigProvider, theme } from "antd";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

const NewPassword = ({ AdminID, dataServer, form1 }) => {
  
  const [token, setToken] = useState(() => {
    // 从Cookie中读取令牌
    const storedToken = document.cookie.replace(
      /(?:(?:^|.*;\s*)jwt\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    return storedToken || "";
  });
  const navigate = useNavigate();
  const navigateTo = () => {
    // 清除 Cookie 或执行其他操作
    document.cookie = "jwt=;";

    navigate("/");
  };

  const onFinish = async (values) => {
    console.log("Success:", values);
    try {
      const response = await fetch(dataServer+"/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // 指定请求体类型为 JSON
          // 如果有其他头部信息，也可以在这里添加
        },
        body: JSON.stringify({
          adminid: AdminID,
          password: values.password,
          updatePassword: values.updatePassword,
        }), // 将数据转换为JSON格式
      });
      const jsonData = await response.json();
      console.log(jsonData);
      if (!jsonData.success) {
        if (jsonData.errorcode === 1) {
          message.error("用户名不存在", 7);
        } else {
          message.error("密码不正确", 7);
        }

        throw new Error("Network response was not ok");
      } else {
        message.success("更改成功,正返回重新登陆", 3, navigateTo);
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
        form={form1}
        name="UpdatePassword"
        autoComplete="off"
        style={{
          maxWidth: 600,
        }}
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <Form.Item
          label="旧的密码"
          name="password"
          rules={[
            {
              required: true,
              message: "Please input your password!",
            },
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label="新的密码"
          name="updatePassword"
          rules={[
            {
              required: true,
              message: "Please a password!",
            },
          ]}
        >
          <Input.Password />
        </Form.Item>

        {/* Field */}
        <Form.Item
          label="确认密码"
          name="password2"
          dependencies={["updatePassword"]}
          rules={[
            {
              required: true,
              message: "Please confirm password!",
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("updatePassword") === value) {
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
          确认更改
        </Button>
      </Form.Item> */}
      </Form>
    </ConfigProvider>
  );
};
export default NewPassword;

NewPassword.propTypes = {
  AdminID: PropTypes.string.isRequired,
  dataServer: PropTypes.string.isRequired,
  form1: PropTypes.func.isRequired,
};
