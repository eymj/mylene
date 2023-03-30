import React, {useRef, useState, useEffect, createContext} from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import "../index.css";
import {useAuth} from "../App"

const DOMPurify = require('dompurify');


const isValidUrl = urlString => {
	var urlPattern = new RegExp('(b(https?|ftp|file)://)?[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]');
	return !!urlPattern.test(urlString);
}

function UserFeed() {
	const [token, setToken, resetToken] = useAuth()
	const [sources, setSources] = useState({sources: []})
	const [posts, setPosts] = useState([])
	const [pendingPosts, setPendingPosts] = useState([])
	let navigate = useNavigate();

	useEffect(() => {
		if (!token) {
			navigate("/login")
		}
	}, [token, navigate]);

	function fetchSourcesData() {
		const headers = {
			'Authorization': 'Bearer ' + token,
		};
		axios.get('/api/user/sources', {headers})
			.then(res => {
					if (res.status === 200) {
						return res.data
					}
					throw new Error('Token invalid!');
				}
			).then(data => setSources(data)).catch(
			function (error) {
				console.log('Authentification failed!');
				resetToken()
			}
		)
	}

	function fetchPostsData(initial) {
		const headers = {
			'Authorization': 'Bearer ' + token,
		};
		axios.get('/api/user/posts', {headers})
			.then(res => {
					if (res.status === 200) {
						return res.data
					}
					throw new Error('Token invalid!');
				}
			).then(data => (initial) ? setPosts(data.posts) : setPendingPosts(data.posts)).catch(
			function (error) {
				console.log('Authentification failed!');
				resetToken()
			}
		)
	}

	useEffect(() => {
		fetchSourcesData()
		fetchPostsData(true)
		setInterval(() => fetchPostsData(false), 270000)
	}, []);

	const handleSourceChange = () => {
		fetchSourcesData()
	}

	const handleLoadNew = () => {
		setPosts(pendingPosts)
		setPendingPosts([])
	}

	return (
		!token ? <div></div> :
			<div className="UserFeed">
				<Controls sources={sources} onSourceChange={handleSourceChange}/>
				<Feed posts={posts.sort((a, b) => {
					return a.date < b.date
				})} pendingPosts={pendingPosts} onLoadNew={handleLoadNew} isPublic={false}/>
			</div>
	);
}

function Controls({sources, onSourceChange}) {

	return (
		<div className="Controls">
			<AddLinkForm onSourceChange={onSourceChange}/>
			<SourcesList sources={sources} onSourceChange={onSourceChange}/>
		</div>
	);
}


function SourcesList({sources, onSourceChange}) {

	return (
		<div className="SourcesList">
			{(sources.sources.length === 0) ? <span>You don't have any sources</span> : null}
			{sources.sources.map(data =>
				(data) ? <Source key={data.sourceUID} data={data} onSourceChange={onSourceChange}/> : null
			)}
		</div>
	);
}

function Source({data, onSourceChange}) {
	const form = useRef(null)
	const inputTitle = useRef(null)
	const inputUrl = useRef(null)
	const [token, resetToken] = useAuth()
	let regex = /(?:[\w-]+\.)+[\w-]+/
	let domain = regex.exec(data.url)

	const handleDelete = (e) => {
		e.preventDefault()
		fetch('/api/user/sources/' + data.sourceUID, {
			method: 'DELETE',
			headers: {
				"Content-Type": "application/json",
				"Authorization": "Bearer " + token,
			}
		}).then(res => {
			if (res.status === 200) {
				onSourceChange()
			}
			if (res.status === 400) {
				resetToken()
			}
		})
	}

	const handleEdit = (newData) => {
		fetch('/api/user/sources/' + data.sourceUID, {
			method: 'PUT',
			headers: {
				"Content-Type": "application/json",
				"Authorization": "Bearer " + token,
			},
			body: JSON.stringify(newData)
		}).then(res => {
			if (res.status === 200) {
				onSourceChange()
			}
			if (res.status === 400) {
				resetToken()
			}
		})
	}

	const handleURLBlur = (e) => {
		const formData = Object.fromEntries(new FormData(form.current))
		if (formData.url === data.url) {
			return false
		}
		if (!isValidUrl(formData.url)) {
			inputUrl.current = data.url
			return false
		}
		handleEdit(formData)
	}

	const handleTitleBlur = (e) => {
		const formData = Object.fromEntries(new FormData(form.current))
		if (formData.title === data.title) {
			return false
		}
		if (formData.title === "") {
			inputTitle.current = data.title
			return false
		}
		handleEdit(formData)
	}

	return (
		<div className="Source">
			<form ref={form} className="SourceContainer">
				<div className="SourceContainerStart">
					<img className="favicon" height="16" width="16"
						 src={'http://www.google.com/s2/favicons?domain=' + domain} alt=""/>
					<input autoComplete="off" ref={inputTitle} defaultValue={data.title} type="text" name="title"
						   id={"title-" + data.sourceUID} onBlur={handleTitleBlur}/>
					<div className="SourceControls">
						<button className="smallButton" onClick={handleDelete}>
							<img src="/res/delete-outline.svg" alt=""/>
						</button>
					</div>
				</div>
				<div className="SourceContainerEnd">
					<input autoComplete="off" ref={inputUrl} defaultValue={data.url} type="text" name="url"
						   id={"url-" + data.sourceUID}
						   onBlur={handleURLBlur}/>
				</div>
			</form>

		</div>

	);
}

function AddLinkForm({onSourceChange}) {
	const form = useRef(null)
	const [message, setMessage] = useState("")
	const [token, setToken, resetToken] = useAuth()
	let [isAddLinkFormVisible, setAddLinkFormVisible] = useState(false);
	const ToggleAddLinkFormVisible = () => {
		setAddLinkFormVisible(!isAddLinkFormVisible);
	};

	function handleFormSubmit(e) {
		e.preventDefault()
		const data = new FormData(form.current)
		if (!isValidUrl(data.url)) {
			document.getElementById("url").classList.toggle("error", true)
			return false
		} else {
			document.getElementById("url").classList.toggle("error", false)
		}
		if (data.title === "") {
			document.getElementById("title").classList.toggle("error", true)
			return false
		} else {
			document.getElementById("title").classList.toggle("error", false)
		}

		fetch('/api/user/sources', {
			method: 'POST',
			headers: {
				"Content-Type": "application/json",
				"Authorization": "Bearer " + token,
			},
			body: JSON.stringify(Object.fromEntries(data))
		}).then(res => {
			if (res.status === 200) {
				ToggleAddLinkFormVisible()
				onSourceChange()
			}
			if (res.status === 400) {
				res.json().then(data => setMessage(data.message));
				if (res.status === 500) {
					res.json().then(data => setMessage(data.message));
				}
			}
		})
	}

	return (<div className="AddLinkButtonWrapper">
		<button className={isAddLinkFormVisible ? "active roundButton" : "roundButton"}
				onClick={ToggleAddLinkFormVisible}><img
			src="/res/add-link.svg" alt=""/></button>
		<div className={isAddLinkFormVisible ? "ControlsAddURL active" : "ControlsAddURL"}>
			<form ref={form} onSubmit={handleFormSubmit}>
				<div className="formSectionFields">
					<input autoComplete="off" placeholder="Title" type="text" name="title" id="title"/>
				</div>
				<div className="formSectionFields">
					<input autoComplete="off" placeholder="URL" type="text" name="url" id="url"/>
				</div>
				<div className="formSectionButtons">
					<button type="submit">Add feed</button>
				</div>
			</form>
		</div>
	</div>);
}

export function Feed({posts, pendingPosts, onLoadNew, isPublic}) {
	let [feedLength, setFeedLength] = useState(4)
	return (
		<div className="Feed">
			{(pendingPosts.length - posts.length > 0) ?
				<div className="FeedControls">
					<button onClick={(e) => onLoadNew()}>Load {pendingPosts.length - posts.length} new
						posts
					</button>
				</div> : null}
			<TimelineView posts={posts.slice(0, feedLength)} isPublic={isPublic}/>
			<div className="FeedControls">
				{(posts.length > feedLength) ?
					<button onClick={(e) => setFeedLength(feedLength + 5)}>Show more</button> : null}
			</div>
		</div>
	);
}

function TimelineView({posts, isPublic}) {
	return (
		<div className="TimelineView">
			{posts.map((post) =>
				<TimelineViewPost key={post.postUID} data={post} isPublic={isPublic}/>
			)}
		</div>
	);
}

function TimelineViewPost({data, isPublic}) {
	let regex = /(?:[\w-]+\.)+[\w-]+/
	let stripStyles = /\<(\w+)\s[^>]*?style=([\"|\']).*?\2\s?[^>]*?(\/?)>/gmi
	let [expanded, setExpand] = useState(false)
	const [token, setToken, resetToken] = useAuth()
	let [localPublic, setLocalPublic] = useState(data.public)

	const handleExpand = (e) => {
		setExpand(!expanded)
	}

	const handleToggleShare = (e) => {
		fetch('/api/user/posts/' + data.postUID, {
			method: 'PUT',
			headers: {
				"Content-Type": "application/json",
				"Authorization": "Bearer " + token,
			},
			body: JSON.stringify({"public": !data.public})
		}).then(data => setLocalPublic(!localPublic)
		)
	}

	return (
		<div className={(localPublic) ? "TimelineViewPost public" : "TimelineViewPost"}>
			<div className="TimelineViewPostWrapper">
				<div className="TimelineViewPostMeta">
					<img className="favicon" height="16" width="16"
						 src={'http://www.google.com/s2/favicons?domain=' + regex.exec(data.link)}
						 alt=""/>
					<span className="link">{regex.exec(data.link)}</span>
				</div>
				<div className="TimelineViewPostTitle">{data.title}</div>
				<div className={(expanded) ? 'TimelineViewPostContent active' : 'TimelineViewPostContent'}
					 dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(data.content.replace(stripStyles, ""))}}></div>
				<div className="TimelineViewPostEnd">
					<button onClick={(e) => {
						handleExpand(e)
					}} className="smallFeedButton">{(expanded) ? <img src="/res/expandless.svg" alt=""/> :
						<img src="/res/expandmore.svg" alt=""/>}</button>
					<a href={data.link}>
						<button className="smallFeedButton"><img src="/res/link.svg" alt=""/></button>
					</a>
					{(isPublic) ? null :
						<button onClick={(e) => handleToggleShare(e)} className="smallFeedButton share"><img
							src="/res/share.svg"
							alt=""/></button>}
				</div>
			</div>

		</div>
	);
}

export default UserFeed