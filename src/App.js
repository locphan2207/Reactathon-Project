import React, { Component } from 'react';
import './App.css';

// Import Actions
import { fetchSpeaker } from './frontend/actions/speakers_actions';
import { setToken } from './frontend/actions/auth_actions';

// Import React-Redux
import { connect } from 'react-redux';

// Import our components:
import VideoBox from './components/VideoBox';
import ChatBox from './components/ChatBox';
import NameEntry from './components/NameEntry';



class App extends Component {

  componentDidMount() {

  }

  render() {
    const { currentUser } = this.props;
    return (
      <div>
        { currentUser &&
        <div className="App">
          <div className="App2">
            <VideoBox />
            <ChatBox />
          </div>
        </div>
        }

        { !currentUser && <NameEntry /> }


      </div>
    );
  }
}

const mapStateToProps = state => {
  return { currentUser: state.session.currentUser };
};

const mapDispatchToProps = dispatch => {
  return {
    fetchSpeaker: () => { return dispatch(fetchSpeaker()) },
    setToken: token => { dispatch(setToken(token)) }
  };
};



export default connect(mapStateToProps, mapDispatchToProps)(App);
