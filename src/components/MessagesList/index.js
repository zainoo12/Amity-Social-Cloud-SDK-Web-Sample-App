import React, { Component } from 'react'
import InfiniteScroll from 'react-infinite-scroller';
import { MessageRepository, EkoLoadingStatus } from 'eko-sdk';

import Message from './Message'


class MessagesList extends Component {
  constructor(props) {
    super(props);
    this.messageCollection = undefined;
    this.messageRepo = new MessageRepository();
    this.state = {
      messages: [],
      canLoadMore: false,
    };
  }

  componentDidMount() {
    this.resetMessageCollection();
    console.log('hey');
  }

  static getDerivedStateFromProps(props, state) {
    if (props.currentChannelId !== state.prevChannelId) {
      return {
        messages: [],
        canLoadMore: false,
        prevChannelId: props.currentChannelId,
      };
    }

    return null;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.currentChannelId !== this.props.currentChannelId) {
      this.resetMessageCollection();
    }
  }

  componentWillUnmount() {
    this.messageCollection && this.messageCollection.dispose();
  }

  // Render messages in Channel
  resetMessageCollection = () => {
    this.messageCollection && this.messageCollection.dispose();
    // Get messages in selected Channel
    this.messageCollection = this.messageRepo.messagesForChannel({ channelId: this.props.currentChannelId });

    // Once message data is received, run the following code.
    this.messageCollection.on('dataUpdated', data => {
      this.setState({ messages: data });
    });

    this.messageCollection.on('loadingStatusChanged', ({ newValue }) => {
      if (newValue === EkoLoadingStatus.Loaded) {
        this.setState({ canLoadMore: this.messageCollection.hasMore });
      } else {
        this.setState({ canLoadMore: false });
      }
    });
  }

  render() {
    const { canLoadMore, messages } = this.state;

    return (
      <div id="message-infinite-scroll-wrapper">
        <InfiniteScroll
          loadMore={() => canLoadMore && this.messageCollection.nextPage()}
          hasMore={canLoadMore}
          useWindow={false}
          loader={<span key={0}>Loading</span>}
          isReverse
        >
          <ul id="message-list">
            {messages.map(message => (
              <Message
                key={message.messageId}
                {...message}
              />
            ))}
          </ul>
        </InfiniteScroll>
      </div>
    );
  };
};

export default MessagesList