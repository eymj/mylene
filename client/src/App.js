import React, {useContext, useState, useEffect, createContext} from "react";
import {Outlet, NavLink, useNavigate} from "react-router-dom";
import axios from "axios";
import "./index.css";

const AuthContext = createContext();

function AuthProvider({children}) {
	let [token, setToken] = useState(JSON.parse(localStorage.getItem("tokenKey")) || "")
	let navigate = useNavigate();

	let resetToken = () => {
		setToken("")
		navigate("/");
	}

	useEffect(() => {
		if (token) {
			localStorage.setItem('tokenKey', JSON.stringify(token));
		} else {
			localStorage.removeItem('tokenKey');
		}
	}, [token]);

	return <AuthContext.Provider value={[token, setToken, resetToken]}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	return useContext(AuthContext);
}

function Header() {
	let [token, resetToken] = useAuth();
	let [username, setUsername] = useState("")

	useEffect(() => {
		if (token) {
			const headers = {
				'Authorization': 'Bearer ' + token,
			};
			axios.get('/api/user', {headers})
				.then(res => {
						if (res.status === 200) {
							return res.data
						}
						throw new Error('Token invalid!');
					}
				).then(data => setUsername(data.username)).catch(
				function (error) {
					console.log('Authentification failed!');
					resetToken()
				}
			)
		}
	}, [token, resetToken]);


	return (
		<div className="Header">
			<div className="wordmark"><NavLink to="/">Mylène <span className="version">v0.1</span></NavLink></div>
			<div className="headerMenu">
				{!token ?
					<NavLink to="/login">Login</NavLink>
					:
					<div className="flex"><span>Logged in as <b>{username} </b></span>
						<img className="logout" onClick={(e) => resetToken()} src="/res/logout.svg" alt=""/>
					</div>
				}
			</div>
		</div>
	);
}

function App() {

	return (
		<AuthProvider>
			<div className="App">
				<Header/>
				<main><Outlet/></main>
			</div>
		</AuthProvider>
	);
}

export default App;