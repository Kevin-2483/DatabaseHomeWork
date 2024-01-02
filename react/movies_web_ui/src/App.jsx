import React, { useState, useEffect } from "react";
import {
  Flex,
  Button,
  DatePicker,
  Form,
  Input,
  Rate,
  message,
  Drawer,
  Table,
} from "antd";

const App = () => {
  const storedDataServer = localStorage.getItem("myDataServer");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataServer, setDataServer] = useState(
    storedDataServer == null ? "http://127.0.0.1:3000" : storedDataServer
  );
  const [search, setSearch] = useState(null);
  const [open, setOpen] = useState(false);
  const { Search } = Input;
  useEffect(() => {
    localStorage.setItem("myDataServer", dataServer);
  }, [dataServer]);
  console.log(search);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          dataServer + "/movies/" + (search == null ? " " : search)
        );
        const jsonData = await response.json();

        // 处理数据：将 EventID 重命名为 key
        const newData = jsonData.map((item) => {
          const { movie_description, ...newItem } = item; // 使用解构和 rest 运算符，将 movie_description 从原对象中移除
          return {
            ...newItem,
            key: item.moviesID, // 添加 key 字段
            description: movie_description, // 添加 description 字段
          };
        });
        setData(newData);
        console.log(newData);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, search]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error.message}</p>;
  }

  const showDrawer = () => {
    setOpen(true);
  };
  const onClose = () => {
    setOpen(false);
  };
   
  const onFinish = async (values) => {
    console.log("Success:", values);
    try {
      const response = await fetch(dataServer + "/movies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          moviesID: values.moviesID,
          movie_name: values.movie_name,
          movie_description: values.movie_description,
          movieURL: values.url,
          movie_rating: values.movie_rating,
          release_date: values.release_date,
        }), // 将数据转换为JSON格式
      });
      const jsonData = await response.json();
      console.log(jsonData);
      if (!jsonData.success) {
        message.error(jsonData.message, 7);

        throw new Error(jsonData.message);
      } else {
        message.success("添加成功", 3);
      }
    } catch (error) {
      console.error("Error during POST request:", error);
    }
  };
  const onFinishFailed = (errorInfo) => {
    message.error(errorInfo);
    console.log("Failed:", errorInfo);
  };
  const { TextArea } = Input;
  
  const openInNewTab = (url) => {
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      newWindow.opener = null; // 防止新标签页访问父页面
    }
  };

  const columns = [
    {
      title: "EventID",
      dataIndex: "key",
      key: "key",
      
    },
    {
      title: "movie_name",
      dataIndex: "movie_name",
      key: "movie_name",
    },
    {
      title: "movieURL",
      dataIndex: "url",
      key: "url",
    },
    {
      title: "movie_rating",
      dataIndex: "movie_rating",
      key: "movie_rating",
      render: (record) =>
        record ? <Rate value={parseFloat(record)} disabled /> : null,
    },
    {
      title: "Action",
      dataIndex: "",
      key: "x",
      render: (record) => (
        <Button
          type="primary"
          onClick={() => openInNewTab(record.url)}
          target="_blank"
          rel="noopener noreferrer"
        >
          查看视频
        </Button>
      ),
    },
  ];

  return (
    <>
      <Flex
        style={{
          width: "100vw",
          height: "100vh",
          borderRadius: 6,
          border: "0px solid #40a9ff",
        }}
        justify={"space-evenly"}
        align={"center"}
        vertical
      >
        <h1>Movies Database</h1>
        <Search
          placeholder="input search text"
          allowClear
          enterButton="Search"
          size="large"
          style={{
            width: "62vw",
          }}
          onSearch={(value) => setSearch(value)}
        />
        <Table
          columns={columns}
          expandable={{
            expandedRowRender: (record) => (
              <p
                style={{
                  margin: 0,
                }}
              >
                {record.description}
              </p>
            ),
            rowExpandable: (record) => record.movie_name !== "Not Expandable",
          }}
          dataSource={data}
          style={{ width: "80vw", margin: "10px 10px 10px 10px" }}
        />
      </Flex>
      <Button
        type="primary"
        onClick={showDrawer}
        style={{ margin: "10px 10px 10px 10px" }}
      >
        Open
      </Button>

      <Drawer
        title="Basic Drawer"
        placement="right"
        onClose={onClose}
        open={open}
      >
        <h4>Server URL:</h4>
        <Input
          value={dataServer}
          onChange={(e) => setDataServer(e.target.value)}
        ></Input>
        <Form
          name="basic"
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item
            label="moviesID"
            name="moviesID"
            rules={[
              {
                required: true,
                message: "Please input moviesID!",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="movie_name"
            name="movie_name"
            rules={[
              {
                required: true,
                message: "Please input movie_name!",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="movie_description"
            name="movie_description"
            rules={[
              {
                required: true,
                message: "Please input movie_description!",
              },
            ]}
          >
            <TextArea />
          </Form.Item>
          <Form.Item
            label="movieURL"
            name="url"
            rules={[
              {
                required: true,
                message: "Please input movieURL!",
              },
            ]}
          >
            <TextArea />
          </Form.Item>
          <Form.Item
            label="movie_rating"
            name="movie_rating"
            rules={[
              {
                required: true,
                message: "Please input movie_rating!",
              },
            ]}
          >
            <Rate />
          </Form.Item>
          <Form.Item
            label="release_date"
            name="release_date"
            rules={[
              {
                required: true,
                message: "Please input release_date!",
              },
            ]}
          >
            <DatePicker />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};
export default App;
