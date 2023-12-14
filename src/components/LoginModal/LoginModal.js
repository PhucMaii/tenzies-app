import React, { useState } from 'react';
import Modal from "react-modal";
import { nanoid } from 'nanoid';
import { Alert, Snackbar } from '@mui/material';
import { PutItemCommand, ScanCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { marshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export default function LoginModal({ isOpen, modalStyle, onClose, setCurrentUser }) {
    const [isNewUser, setIsNewUser] = useState(false);
    const [userData, setUserData] = useState({
        username: '',
        password: ''
    });
    const [notification, setNotification] = useState({
        on: false,
        severity: 'success',
        message: ''
    });

    const client = new DynamoDBClient({
        region: 'us-west-2',
        credentials: {
            accessKeyId: 'AKIAYHAZ3NETFFR3HTSF',
            secretAccessKey: '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'
        },
    });
    
    const docClient = DynamoDBDocumentClient.from(client);

    const onCreate = async (newItem) => {
        newItem.uid = nanoid();
        newItem.record = '1000:1000';

        const params = {
            TableName: "users",
            Item: marshall(newItem)
        };

        try {
            await docClient.send(new PutItemCommand(params));
            console.log('User created successfully:', newItem);
            localStorage.setItem('current-user', JSON.stringify(newItem));
            setCurrentUser(newItem);
        } catch (err) {
            console.error('Error creating user:', err);
        }
    };

    const authenticateUser = async () => {
        const params = {
            TableName: "users"
        };

        try {
            const data = await docClient.send(new ScanCommand(params));
            console.log(data);
            const userList = data.Items;

            const foundUser = userList.find((user) => user.username.S === userData.username);

            if (foundUser) {
                if (foundUser.password.S === userData.password) {
                    onClose();
                    localStorage.setItem('current-user', JSON.stringify(foundUser));
                    setCurrentUser(foundUser);
                } else {
                    setNotification({
                        on: true,
                        severity: 'error',
                        message: 'Incorrect Password, Username Exists Already'
                    });
                }
            } else {
                await onCreate(userData);
                setIsNewUser(true);
                setNotification({
                    on: true,
                    severity: 'success',
                    message: 'User Created Successfully'
                });
            }
        } catch (err) {
            console.error('Error scanning users:', err);
        }
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
                        onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                    />
                </div>
                <div className="input-container">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="text"
                        placeholder="Enter password here..."
                        value={userData.password}
                        onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                    />
                </div>
                <button onClick={authenticateUser}>Register</button>
            </div>
        </Modal>
    );
}
