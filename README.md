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

准备一个linux/macos环境

### 安装软件

请在开始运行前，确保已经安装了以下软件：

1. docker
1. docker-compose
1. [ansible](https://docs.ansible.com/ansible/2.3/intro_installation.html)
1. [jenkins](https://www.jenkins.io/doc/book/installing/war-file/)

### 配置host

请在/etc/hosts中，增加

``` bash
127.0.0.1 demo.app.self
127.0.0.1 dbserver
127.0.0.1 appserver
127.0.0.1 lbserver
```

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

``` docker
REPOSITORY         TAG       IMAGE ID       CREATED          SIZE
db-migration       1.0       40c50d8a3268   55 minutes ago   338MB
demo-app           1.0       3bc69b2ab6c7   30 minutes ago   913MB
```

## 部署脚本

### 本地

#### 升级数据库
`pipenv run ansible-playbook -i ./inventory/hosts db.yml`
#### 部署应用
`pipenv run ansible-playbook -i ./inventory/hosts app.yml`
#### 更改Nginx
`pipenv run ansible-playbook -i ./inventory/hosts lb.yml`
### 使用流水线
`Jenkinsfile-dev`

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
