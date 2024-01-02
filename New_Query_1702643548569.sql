-- 创建数据库
CREATE DATABASE IF NOT EXISTS movies;

-- 切换到新创建的数据库
USE movies;

-- 创建movies表
-- 创建movies表
CREATE TABLE
    IF NOT EXISTS movies (
        moviesID INT PRIMARY KEY,
        movie_name VARCHAR(255),
        movie_description TEXT,
        movie_rating INT,
        release_date DATE,
        url VARCHAR(255)
    );

-- 提示：如果上映日期是具体的日期，可以使用DATE类型；如果只需存储年份，可以使用YEAR类型