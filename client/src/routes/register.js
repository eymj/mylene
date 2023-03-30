import React, {useRef, useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {useAuth} from "../App"
import "../index.css";

function RegisterForm() {
	const [token] = useAuth()
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
		console.log(JSON.stringify(Object.fromEntries(data)))
		fetch('/api/user', {
			method: 'POST',
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify(Object.fromEntries(data))
		}).then(res => {
			if (res.status === 200) {
				navigate("/login")
			}
			res.json().then(data => setMessage(data.message));
		})
	}

	return (
		token ? <div></div> :
			<div className="LoginForm">
				<h2>Register</h2>
				<p className="Message">{message}</p>
				<form ref={form} onSubmit={handleFormSubmit}>
					<div className="formSectionFields">
						<label htmlFor="username">Username</label>
						<input type="text" name="username" id="username"/>
					</div>
					<div className="formSectionFields">
						<label htmlFor="email">Email</label>
						<input type="text" name="email" id="email"/>
					</div>
					<div className="formSectionFields">
						<label htmlFor="password">Password</label>
						<input type="password" name="password" id="password"/>
					</div>
					<div className="formSectionButtons">
						<button type="submit">Register</button>
					</div>
				</form>
			</div>
	);
}

export default RegisterForm