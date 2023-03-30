import React from 'react';
import ReactDOM from 'react-dom/client';
import {
	createBrowserRouter,
	RouterProvider,
} from "react-router-dom";
import './index.css';
import App from './App';

import LoginForm from "./routes/login";
import RegisterForm from "./routes/register";
import UserFeed from "./routes/feed";
import PublicFeed from "./routes/public";

const router = createBrowserRouter([
	{
		path: "/",
		element: <App/>,
		children: [
			{
				index: true,
				element: <PublicFeed/>

			},
			{
				path: "/login",
				element: <LoginForm/>
			},
			{
				path: "/register",
				element: <RegisterForm/>
			},
			{
				path: "/feed",
				element: <UserFeed/>
			},
		],
	},
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<RouterProvider router={router}/>
	</React.StrictMode>
);