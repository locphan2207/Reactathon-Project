import React from 'react';
import Draggable from 'react-draggable';
import {connect} from 'react-redux';
import {createSession} from 'opentok-react';
import moment from 'moment';

import Publisher from './Publisher';
import Subscriber from './Subscriber';
import firebase from '../firebase/firebase.js';

import { updateSpeaker } from '../frontend/actions/speakers_actions';

class VideoBox extends React.Component {
  constructor() {
    super();
    this.state = { queue: {}, inQueue: false, streams: []};
    this.renderPublisher = this.renderPublisher.bind(this);
    this.handleClear = this.handleClear.bind(this);
  }

  componentWillMount() {
    this.sessionHelper = createSession({
      apiKey: '46086882',
      sessionId: '2_MX40NjA4Njg4Mn5-MTUyMTkyNjUwMjA2MX5FL1JpeDdubzFqVnhXMG0zOGV2cmUyTDZ-fg',
      token: 'T1==cGFydG5lcl9pZD00NjA4Njg4MiZzaWc9Yzk4OTZiZDdmMDViMWNjNDViYjc1ZTk1YzU5MTYzMDE1YjU0YjBmYjpzZXNzaW9uX2lkPTJfTVg0ME5qQTROamc0TW41LU1UVXlNVGt5TmpVd01qQTJNWDVGTDFKcGVEZHViekZxVm5oWE1HMHpPR1YyY21VeVREWi1mZyZjcmVhdGVfdGltZT0xNTIxOTMxMzUxJm5vbmNlPTAuMjg4OTgwNzE3MDc3NDYyMSZyb2xlPXB1Ymxpc2hlciZleHBpcmVfdGltZT0xNTI0NTIzMzQ5JmluaXRpYWxfbGF5b3V0X2NsYXNzX2xpc3Q9',
      onStreamsUpdated: streams => { this.setState({ streams }); }
    });

    this.sessionHelper.session.on('signal:speaker', function(event) {
      // This is when other user receive signal to update redux store when speaker changes:
      const { dispatch } = this.props;
      dispatch(updateSpeaker(event.data));
    }.bind(this));
  }

  componentDidMount() {
    firebase.database().ref('queue').on('value', (snapshot) => { // make firebase watch the database realtime
      if ( snapshot.val() ) {
        this.setState({ queue: snapshot.val() });
      }
    });
  }

  raiseQuestion() {
    const timeInUnix = moment().unix();
    firebase.database().ref(`queue/${timeInUnix}`).set({
      name: this.props.currentUser,
      time: timeInUnix
    });
    this.setState({inQueue: true});
  }

  updateSpeaker(user) {
    if (!this.isHost()) return; // Will not do anything if NOT a host

    // Update Speaker in the backend: (Bruce)
    const { dispatch } = this.props;
    dispatch(updateSpeaker(user.name));

    // Send signal to other users to update redux store after we update speaker in the backend:
    this.sessionHelper.session.signal({
      type: 'speaker',
      data: user.name
    }, function(error) {
      if (error) {
        console.log('Error sending signal:', error.name, error.message);
      }
    });

    // Dequeue:
    firebase.database().ref(`queue/${user.time}`).remove();
  }

  isHost() { // To check if a user is the host of this room session:
    return (this.props.host === this.props.currentUser);
  }

  renderQuestionSection() {
    if (this.isHost()) return null; // dont render this if user is a host
    if (this.state.inQueue) {// already in the queue
      let position;
      Object.values(this.state.queue).forEach((user, idx) => {
        if (user.name === this.props.currentUser) {
          position = idx + 1;
        }
      });
      return (
        <div className="queue-wait-text">
          You are position {position} in the queue
        </div>
      );
    } else {
      return (
        <div className="question-button"
          onClick={() => this.raiseQuestion()}>
          Ask Question
        </div>
      );
    }
  }

  renderPublisher() {
    // if (this.props.currentUser === "host") {
    //   return <div className=""><Publisher />;
    // }
    return <Publisher />;
  // renderPopUp() {
  //   if (this.props.speaker === "") {// if no speaker is allowed, dont show the pop up
  //     return null;
  //   } else {
  //     return (
  //       <Draggable bounds="parent">
  //         <div className="popup-video">
  //           <Subscriber />
  //         </div>
  //       </Draggable>
  //     );
  //   }
  }

  renderSpeaker() {
    if (this.props.speaker === "") return null; // if no speaker, dont show pop-up video
    return (
      <Draggable bounds="parent">
        <div className="popup-video">
          <Subscriber name={this.props.speaker}/>
        </div>
      </Draggable>
    );
  }

  renderVideo() {
    if (this.isHost()) { // i am a host
      return (
        <div className="main-video">
          {this.renderPublisher()};
          {this.renderSpeaker()}
        </div>
      );
    } else if (this.props.currentUser === this.props.speaker) { // i am a speaker
      return (
        <div className="main-video">
          <Subscriber name="host"/>
          <Draggable bounds="parent">
            <div className="popup-video">
              {this.renderPublisher()}
            </div>
          </Draggable>
        </div>
      );
    } else { // i am just a viewer
      return (
        <div className="main-video">
          <Subscriber name="host"/>
          {this.renderSpeaker()}
        </div>
      );
    }
  }

  handleClear() {
    const { dispatch } = this.props;
    dispatch(updateSpeaker(""));
  }

  render() {
    const queue = Object.values(this.state.queue);
    const { host, currentUser } = this.props;

    let queueClass = this.isHost() ? 'queue short' : 'queue';

    return(
      <div className="video-box">

        {this.renderVideo()}
        {this.renderQuestionSection()}
        <div className="queue__wrapper">
          {this.isHost() && <button onClick={this.handleClear}>Clear Speaker</button>}
          <p>Queue (Total {queue.length})</p>
          <ul className={queueClass}>
            {queue.slice(0,12).map((user, idx) => {
              const timeAgo = moment.unix(user.time).fromNow();
              return (
                <li key={idx} className="queue-item"
                  onClick={(e) => this.updateSpeaker(user)}>
                  {user.name} ({timeAgo})
                </li>
              );
            })}
          </ul>
      </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    currentUser: state.session.currentUser,
    host: state.host.name,
    speaker: state.speaker
  };
};

const mapDispatchToProps = dispatch => {
  return {
    dispatch
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(VideoBox);
