# automatic-deployment-demo

## 部署目标说明

``` ascii
   +-----------+       +--------------+      +---------+    
-->|   NGINX   |------>|   DEMO APP   |----->| DEMO DB |    
   |     LB    |       |     Node     |      |  MySQL  |    
   demo.app.self       |    13000     |      |  3307   |    
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
       image:   
       db-migration:1.0  
       demo-app:1.0                                        
```

通过自动化部署来完成：

1. 数据库的升级
1. DEMO APP的应用更新
   1. 同一个版本应用存在，则卸载应用
   1. 部署新版应用
   1. 冒烟测试，需要能正常连接数据库并返回值
1. 配置Nginx的反向代理，可以通过`http://localhost:8002/app`来访问`DEMO APP`应用
   1. 指向最新版本的应用
   2. 冒烟测试，需要能正常访问并返回DEMO APP的结果

在完成部署后，访问`http://localhost:8002/hello-world`可以看到`demo`文字，即为成功。

## 环境准备

准备一个linux/macos环境。  
请在开始运行前，确保已经安装了以下软件：
* docker

请在/etc/hosts中，增加

``` bash
127.0.0.1 demo.app.prod
```


### 部署基础设施
1. 使用`docker compose -f ./Infra.yml up -d`来完成 nginx mysql jenkins 的部署，和网络环境的搭建  
1. 使用`docker compose -f ./Infra.yml ps`查看部署状态 
``` docker
NAME                COMMAND                  SERVICE             STATUS              PORTS
jenkins             "/sbin/tini -- /usr/…"   jenkins             running             0.0.0.0:8080->8080/tcp, 0.0.0.0:50000->50000/tcp
mysql.demo          "docker-entrypoint.s…"   mysql               running             0.0.0.0:13306->3306/tcp
www.example.com     "/bin/sh -c 'bash -c…"   nginx               running (healthy)   0.0.0.0:2023->22/tcp, 0.0.0.0:80->80/tcp
```  
4. 使用`docker network ls`查看部署的网络**auto-deployment-demo**已经部署成功 
``` docker
NETWORK ID     NAME                   DRIVER    SCOPE
444b63310f87   auto-deployment-demo   bridge    local
```

### 构建镜像
`docker-compose -f ./artifact.yml build`来完成

``` docker
REPOSITORY         TAG       IMAGE ID       CREATED          SIZE
db-migration       1.0       40c50d8a3268   55 minutes ago   338MB
demo-app           1.0       3bc69b2ab6c7   30 minutes ago   913MB
```

## 部署脚本

### 本地

首先运行`docker build -f ./dockerfiles/dev-debug/dockerfile --force-rm  -t ansible-debug-env:v1 ./dockerfiles/dev-debug`
构建一个可以ssh nginx镜像的ansible容器作为本地调试使用
#### 升级数据库

`docker run -it -v $(pwd)/deploy:/root/deploy -v /var/run/docker.sock:/var/run/docker.sock ansible-debug-env:v1 ansible-playbook -i ./inventory/dev db.yml`
#### 部署应用
`docker run -it -v $(pwd)/deploy:/root/deploy -v /var/run/docker.sock:/var/run/docker.sock ansible-debug-env:v1 ansible-playbook -i ./inventory/dev app.yml`
#### 更改Nginx
`docker run -it -v $(pwd)/deploy:/root/deploy -v /var/run/docker.sock:/var/run/docker.sock ansible-debug-env:v1 ansible-playbook -i ./inventory/dev lb.yml`

### 多环境
#### 配置和脚本分离
我们的目标是使用同一套部署脚本在不同环境中部署。  
但是每个环境的硬件等配置信息不尽相同，这里就存在一个问题:如何使用同一个脚本适配到不同的环境？  
方法就是配置信息不要hard code在脚本中，而是脚本通过变量来访问这些配置信息。  
##### 具体处理例子
这里使用了ansible的变量机制来实现的：

1. 将配置信息提取为变量
2. 在每个环境的inventory中设定变量对应的值

###### 示例

配置信息提取为变量

``` yml
- name: deploy new release app
      shell: >
        docker run 
        -p {{app_port}}:3000 
        -e DBHost={{db_host}} 
        -e DBPort={{db_port}} 
        -e DBUser={{db_user}} 
        -e DBPasswrod={{ db_password }} 
        -e DB={{ db_name }} 
        --name app-v1
        -d  
        demo-app:1.0
      register: command_output
```

在每个环境的inventory中设定变量对应的值

``` yml
[all:vars]
service_url=http://demo.app.self/demo
db_host=192.168.31.31
db_port=13306
db_name=demo
db_user=demo
```

#### 多环境适配
##### 多环境配置设定

这里使用ansible的inventory多环境配置来解决，即在inventory文件夹下为每个环境新建对应文件夹，并放入hosts、group_vars等配置

##### jenkins

新建 jenkins-prod 文件

## 展示效果
访问 http://demo.app.prod/demo 