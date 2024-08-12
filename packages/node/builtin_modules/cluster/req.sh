#!/bin/bash
###
 # @Date         : 2024-07-28 17:33:04 星期0
 # @Author       : xut
 # @Description  : 
### 

# req.sh
for((i=1;i<=4;i++)); do   
  curl http://127.0.0.1:8000
  echo ""
done 
