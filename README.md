# automatic-deployment-demo

## 部署目标说明

``` ascii
+-----------+       +--------------+      +---------+    
|   NGINX   |------>|   DEMO APP   |----->| DEMO DB |    
|     LB    |       |     Node     |      |  MySQL  |    
|    8002   |       |    13000     |      |  3307   |    
+-----------+       +--------------+      +---------+    
       ^                    ^                     ^      
       |                    |                     |      
       +----------|         |           |----------+     
           3. LB指向应用 2. 部署新版应用  1. 升级数据库  
------------------|---------|-----------|----------------
                  |         |           |                
                  |         |           |                
    +------------------------------------------+         
    |            Jenkins Pipeline              |         
    +------------------------------------------+                                                        
```

通过自动化部署来完成：

1. 数据库的升级
1. DEMO APP的应用更新
1. 配置Nginx的反向代理，可以通过`http://localhost:8002/hello-world`来访问`DEMO APP`应用

在完成部署后，访问`http://localhost:8002/hello-world`可以看到`demo`文字，即为成功。

## 环境准备

### 安装软件

请在开始运行前，确保已经安装了以下软件：

1. docker
1. docker-compose
1. [pipenv](https://github.com/pypa/pipenv#installation)
1. [jenkins](https://www.jenkins.io/doc/book/installing/war-file/)

### 部署基础设施

`docker-compose -d -f ./Infra.yml up`
来完成 nginx 和 mysql 的部署。

``` docker
     Name                    Command                  State                   Ports
-----------------------------------------------------------------------------------------------
mysql.demo        docker-entrypoint.sh mysqld      Up             0.0.0.0:13306->3306/tcp,
                                                                  33060/tcp
www.example.com   /bin/sh -c bash -c "/usr/s ...   Up (healthy)   0.0.0.0:2023->22/tcp,
```

### 构建镜像

`docker-compose -f ./artifact.yml build`来完成
