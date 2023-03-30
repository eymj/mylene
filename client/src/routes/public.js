import React, {useRef, useState, useEffect, createContext} from "react";
import axios from "axios";
import "../index.css";
import {Feed} from "./feed"

function PublicFeed() {
	const [posts, setPosts] = useState([])
	const [pendingPosts, setPendingPosts] = useState([])

	function fetchPostsData(initial) {
		axios.get('/api/posts')
			.then(res => {
					if (res.status === 200) {
						return res.data
					}
				}
			).then(data => (initial) ? setPosts(data.posts) : setPendingPosts(data.posts))
	}

	useEffect(() => {
		fetchPostsData(true)
		setInterval(() => fetchPostsData(false), 270000)
	}, []);

	const handleLoadNew = () => {
		setPosts(pendingPosts)
		setPendingPosts([])
	}

	return (
		<div className="PublicFeed">
			<Feed posts={posts} pendingPosts={pendingPosts} onLoadNew={handleLoadNew} isPublic={true}/>
		</div>
	);
}


export default PublicFeed