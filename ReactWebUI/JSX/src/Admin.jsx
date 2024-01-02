import {
  Drawer,
  Tooltip,
  Card,
  Skeleton,
  Avatar,
  message,
  Space,
  Button,
  Form,
  ConfigProvider,
  theme,
} from "antd";
import NewPassword from "./NewPassword";
import UpdateFrom from "./UpdateFrom";
import AddAdmin from "./AddAdmin";
import DeleteAdmin from "./DeleteAdmin.jsx";
import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";
const { Meta } = Card;
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

import {
  UserOutlined,
  EditOutlined,
  FormOutlined,
  LogoutOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";

export default function Admin(props) {
  const [form4] = Form.useForm();
  const [form3] = Form.useForm();
  const [form2] = Form.useForm();
  const [form1] = Form.useForm();
  const location = useLocation();
  const currentPath = location.pathname;
  const [refreshData, setRefreshData] = useState(true);
  useEffect(() => {
    if (currentPath === "/admin") {
      props.onValueChange(-2);
    }
  }, [currentPath]);

  const [token, setToken] = useState(() => {
    // 从Cookie中读取令牌
    const storedToken = document.cookie.replace(
      /(?:(?:^|.*;\s*)jwt\s*=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    return storedToken || "";
  });

  const { placement, wh, dataServer } = props;
  const [childrenDrawer1, setChildrenDrawer1] = useState(false);
  const [childrenDrawer2, setChildrenDrawer2] = useState(false);
  const [childrenDrawer3, setChildrenDrawer3] = useState(false);
  const [childrenDrawer4, setChildrenDrawer4] = useState(false);
  const [data, setData] = useState({
    AdminID: "...",
    AdminName: "...",
    AdminContact: "...",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
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
        const response = await fetch(dataServer + "/admin", requestOptions);
        const jsonData = await response.json();

        setData(jsonData);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [childrenDrawer2, dataServer]);
  const navigateTo = () => {
    // 清除 Cookie 或执行其他操作
    document.cookie = "jwt=;";
    props.onValueChange(-1);
    navigate("/");
  };

  if (error) {
    message.error("Token验证失败,正在返回登录", 5, navigateTo);
    return <p>Error: {error.message}</p>;
  }
  const submit = () => {
    form2.submit();
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
        <Card
          style={{
            width: 300,
            marginTop: 16,
          }}
          hoverable
          actions={[
            <Tooltip placement="bottom" title={"更改密码"} key="editPw">
              <EditOutlined onClick={() => setChildrenDrawer1(true)} />
            </Tooltip>,

            <Tooltip placement="bottom" title={"更新信息"} key="update">
              <FormOutlined onClick={() => setChildrenDrawer2(true)} />
            </Tooltip>,
            <Tooltip placement="bottom" title={"登出"} key="logout">
              <LogoutOutlined onClick={navigateTo} />
            </Tooltip>,
          ]}
        >
          <Skeleton loading={loading} avatar active>
            <Meta
              avatar={
                <Avatar shape="square" size={64} icon={<UserOutlined />} />
              }
              title={data.AdminName}
              description={data.AdminContact}
            />
          </Skeleton>
        </Card>

        <Card
          style={{
            width: 300,
            marginTop: 16,
          }}
          onClick={() => setChildrenDrawer3(true)}
          hoverable
        >
          <Skeleton loading={loading} avatar active>
            <Meta
              avatar={
                <Avatar
                  shape="square"
                  size={64}
                  icon={<PlusCircleOutlined />}
                />
              }
              title={"新的管理员"}
              description={"点击以添加"}
            />
          </Skeleton>
        </Card>
        <Card
          style={{
            width: 300,
            marginTop: 16,
          }}
          onClick={() => setChildrenDrawer4(true)}
          hoverable
        >
          <Skeleton loading={loading} avatar active>
            <Meta
              avatar={
                <Avatar
                  shape="square"
                  size={64}
                  icon={<MinusCircleOutlined />}
                />
              }
              title={"注销管理员账户"}
              description={"点击以注销"}
            />
          </Skeleton>
        </Card>
        <Drawer
          title="修改密码"
          width={wh * 0.8 + "vw"}
          height={wh * 0.8 + "vh"}
          placement={placement}
          closable={false}
          onClose={() => setChildrenDrawer1(false)}
          open={childrenDrawer1}
          zIndex={3}
          extra={
            <Space>
              <Button onClick={() => setChildrenDrawer1(false)}>Cancel</Button>
              <Button
                key="submit"
                type="primary"
                onClick={() => {
                  form1.submit();
                }}
                loading={loading}
              >
                提交
              </Button>
            </Space>
          }
        >
          <NewPassword
            AdminID={String(data.AdminID)}
            dataServer={dataServer}
            form1={form1}
          />
        </Drawer>
        <Drawer
          title="更新信息"
          width={wh * 0.8 + "vw"}
          height={wh * 0.8 + "vh"}
          placement={placement}
          closable={false}
          onClose={() => setChildrenDrawer2(false)}
          open={childrenDrawer2}
          zIndex={3}
          extra={
            <Space>
              <Button onClick={() => setChildrenDrawer2(false)}>Cancel</Button>
              <Button
                key="submit"
                type="primary"
                onClick={() => {
                  form2.submit();
                }}
                loading={loading}
              >
                提交
              </Button>
            </Space>
          }
        >
          <UpdateFrom
            AdminID={String(data.AdminID)}
            dataServer={dataServer}
            form2={form2}
          />
        </Drawer>
        <Drawer
          title="添加新的管理员"
          width={wh * 0.8 + "vw"}
          height={wh * 0.8 + "vh"}
          placement={placement}
          closable={false}
          onClose={() => setChildrenDrawer3(false)}
          open={childrenDrawer3}
          zIndex={3}
          extra={
            <Space>
              <Button onClick={() => setChildrenDrawer3(false)}>Cancel</Button>
              <Button
                key="submit"
                type="primary"
                onClick={() => {
                  form3.submit();
                }}
                loading={loading}
              >
                提交
              </Button>
            </Space>
          }
        >
          <AddAdmin dataServer={dataServer} form3={form3} />
        </Drawer>
        <Drawer
          title="注销账户"
          width={wh * 0.8 + "vw"}
          height={wh * 0.8 + "vh"}
          placement={placement}
          closable={false}
          onClose={() => setChildrenDrawer4(false)}
          open={childrenDrawer4}
          zIndex={3}
          extra={
            <Space>
              <Button onClick={() => setChildrenDrawer4(false)}>Cancel</Button>
              <Button
                key="submit"
                type="primary"
                onClick={() => {
                  form4.submit();
                }}
                loading={loading}
              >
                提交
              </Button>
            </Space>
          }
        >
          <DeleteAdmin
            AdminID={String(data.AdminID)}
            dataServer={dataServer}
            form4={form4}
          />
        </Drawer>
      </ConfigProvider>
    </>
  );
}

Admin.propTypes = {
  placement: PropTypes.string.isRequired,
  wh: PropTypes.number.isRequired,
  onValueChange: PropTypes.func.isRequired,
  dataServer: PropTypes.string.isRequired, // 你可以根据实际情况更改类型
};
