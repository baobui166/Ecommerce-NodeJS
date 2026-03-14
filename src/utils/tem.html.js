"use strict";

const htmlEmailToken = () => {
  return `	<!DOCTYPE html>
			<html lang="en">
			<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Email Template</title>

			<style>
			body{
			    margin:0;
			    padding:0;
			    background:#f4f6f8;
			    font-family: Arial, Helvetica, sans-serif;
			}

			.wrapper{
			    width:100%;
			    table-layout:fixed;
			    background:#f4f6f8;
			    padding:40px 0;
			}

			.main{
			    background:#ffffff;
			    margin:0 auto;
			    width:600px;
			    border-radius:8px;
			    overflow:hidden;
			}

			.header{
			    background:#4F46E5;
			    color:white;
			    text-align:center;
			    padding:30px;
			    font-size:24px;
			    font-weight:bold;
			}

			.content{
			    padding:30px;
			    color:#333;
			    line-height:1.6;
			    font-size:16px;
			}

			.button{
			    text-align:center;
			    margin:30px 0;
			}

			.btn{
			    background:#4F46E5;
			    color:white;
			    padding:12px 24px;
			    text-decoration:none;
			    border-radius:6px;
			    font-weight:bold;
			    display:inline-block;
			}

			.footer{
			    text-align:center;
			    padding:20px;
			    font-size:13px;
			    color:#888;
			}

			@media screen and (max-width:600px){
			    .main{
			        width:100% !important;
			    }
			}
			</style>

			</head>

			<body>

			<center class="wrapper">

			<table class="main">

			<tr>
			<td class="header">
			Your Company
			</td>
			</tr>

			<tr>
			<td class="content">

			<h2>Hello {{name}},</h2>

			<p>
			Thank you for using our service. This email confirms that your account has been successfully created.
			</p>

			<p>
			Click the button below to verify your email address and activate your account.
			</p>

			<div class="button">
			<a href="{{link_verify}}" class="btn">
			Verify Account
			</a>
			</div>

			<p>
			If you did not create this account, please ignore this email.
			</p>

			<p>
			Best regards,<br>
			Your Company Team
			</p>

			</td>
			</tr>

			<tr>
			<td class="footer">
			© 2026 Your Company. All rights reserved.
			</td>
			</tr>

			</table>

			</center>

			</body>
			</html>`;
};

module.exports = { htmlEmailToken };
