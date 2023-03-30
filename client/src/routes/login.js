import React, {useRef, useState, useEffect} from "react";
import {NavLink, useNavigate} from "react-router-dom";
import "../index.css";
import {useAuth} from "../App"

function LoginForm() {
	const [token, setToken] = useAuth()
	const form = useRef(null)
	const [message, setMessage] = useState("")
	let navigate = useNavigate();

	useEffect(() => {
		if (token) {
			navigate("/feed")
		}
	}, [token, navigate]);

	function handleFormSubmit(e) {
		e.preventDefault()
		const data = new FormData(form.current)
		fetch('/api/user/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams(data)
		}).then(res => {
			if (res.status === 200) {
				setMessage("")
				return res.json()
			}
			res.json().then(data => setMessage(data.message));
			throw new Error("Login failed!");
		}).then(data => setToken(data.token)).catch(
			function (error) {
				console.log(error);
			})
	}

	return (
		token ? <div></div> : <div className="LoginForm">
			<h2>Login</h2>
			<p className="Message">{message}</p>
			<form ref={form} onSubmit={handleFormSubmit}>
				<div className="formSectionFields">
					<label htmlFor="username">Username</label>
					<input type="text" name="username" id="username"/>
				</div>
				<div className="formSectionFields">
					<label htmlFor="password">Password</label>
					<input type="password" name="password" id="password"/>
				</div>
				<div className="formSectionButtons">
					<button type="submit">Login</button>
				</div>
				<div className="formSectionFooter">
					<NavLink to="/register">Register</NavLink>
				</div>
			</form>
		</div>
	);
}

export default LoginForm