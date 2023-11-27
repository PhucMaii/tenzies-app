import React, { useState } from 'react';
import Modal from "react-modal";
import * as AWS from 'aws-sdk';
import { Alert, Snackbar } from '@mui/material';
import { nanoid } from 'nanoid';

export default function LoginModal({ isOpen, modalStyle, onClose, setCurrentUser }) {
    const [isNewUser, setIsNewUser] = useState(false);
    const [userData, setUserData] = useState({
        username: '',
        password: ''
    });
    const [notification, setNotification] = useState({
        on: false,
        severity: '',
        message: ''
    });

    AWS.config.update({
        region: 'us-west-2',
        endpoint: 'dynamodb.us-west-2.amazonaws.com',
        accessKeyId: 'AKIAYHAZ3NETFFR3HTSF',
        secretAccessKey: '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'
    });
    const docClient = new AWS.DynamoDB.DocumentClient();

    const onCreate = (newItem) => {
        newItem.uid = nanoid();
        newItem.record= '1000:1000';
        let params = {
            TableName: "users",
            Item: newItem
        };
        docClient.put(params, function(err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log(data, "On Create User");
                localStorage.setItem('current-user', JSON.stringify(newItem));
                setCurrentUser(newItem);
            }
        });
    }

    const authenticateUser = () => {
      let params = {
          TableName: "users"
      };
        docClient.scan(params, function(err, data) {
        if (err) {
            console.log(err);
        } else {
          const userList = data.Items;
          const foundUser = userList.find((user) => user.username === userData.username);
            console.log(foundUser, "Found User");
          if(foundUser) {
              if(foundUser.password === userData.password) {
                  onClose();
                  localStorage.setItem('current-user', JSON.stringify(foundUser));
                  setCurrentUser(foundUser);
              } else 
                  setNotification({
                      on: true,
                      severity: 'error',
                      message: 'Incorrect Password, Username Exists Already'
                  })
          } else {
              onCreate(userData);
              setIsNewUser(true);
              setNotification({
                    on: true,
                    severity: 'success',
                    message: 'User Created Successfully'
              })
          }
        }
        });
    };

    return (
        <Modal 
            style={modalStyle}
            isOpen={isOpen}
        >
            <Modal
                style={modalStyle}
                isOpen={isNewUser}
                onRequestClose={() => {
                    onClose();
                    setIsNewUser(false);
                }}
            >
                <div>
                    <h4>Welcome to our tenzies game. Hope you enjoy your experience with our app</h4>
                </div>
            </Modal>
            <div className="form-container">
                <div className="welcome-container">
                    <h4>Welcome to our game</h4>
                    <Alert 
                        severity={notification.severity} 
                        sx={{ width: '100%' }}
                    >
                      {notification.message}
                    </Alert>
                </div>
                <div className="input-container">
                    <label htmlFor="username">Username</label>
                    <input 
                        id="username" 
                        type="text" 
                        placeholder="Enter user name here..." 
                        value={userData.username}
                        onChange={(e) => setUserData({...userData, username: e.target.value})}    
                    />
                </div>
                <div className="input-container">
                    <label htmlFor="password">Password</label>
                    <input 
                        id="password" 
                        type="text" 
                        placeholder="Enter password here..." 
                        value={userData.password}
                        onChange={(e) => setUserData({...userData, password: e.target.value})}    
                    />
                </div>
                <button onClick={authenticateUser}>Register</button>
            </div>
        </Modal>
  )
}
