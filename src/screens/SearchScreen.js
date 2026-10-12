import React from 'react';
import HomeScreen from './HomeScreen';

// Use exactly the same property cards as Home, with full server-side search.
export default function SearchScreen(props) {
  return <HomeScreen key={props.route?.params?.searchKey || "search"} {...props} searchMode />;
}
