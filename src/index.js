import React from 'react';
import ReactDOM from 'react-dom/client';  
import App from './App';
import reportWebVitals from './reportWebVitals';

// AWS.config.update({
//   region: 'us-west-2',
//   endpoint: 'dynamodb.us-west-2.amazonaws.com',
//   accessKeyId: 'AKIAYHAZ3NETFFR3HTSF',
//   secretAccessKey: '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'
// });

// const docClient = new AWS.DynamoDB.DocumentClient();
// let onRead = () => {
//   let params = {
//       TableName: "users"
//   };

//   docClient.scan(params, function(err, data) {
//   if (err) {
//       console.log(err);
//   } else {
//     console.log(data);
//   }
// });
// };
// onRead();
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
