import 'antd/dist/antd.css';

import React, { PureComponent } from 'react';
import EkoClient, { MessageRepository, ChannelRepository, EkoChannelType } from 'eko-sdk';

import { message } from 'antd';
import { Container, Row, ChannelList, MessageListPanel } from './styles';
import SdkConfig from '../sdk-config';
import ChannelListPanel from './ChannelListPanel';
import MessageList from './MessagesList';
import AddMessage from './MessagesList/AddMessage';
import Header from './Header';

// Connect to EkoClient with apiKey
const client = new EkoClient({ apiKey: SdkConfig.SAMPLE_APP_KEY });
// Register Session with EkoClient with userId and display name
client.registerSession({
  userId: SdkConfig.DEFAULT_USER.USER_ID,
  displayName: SdkConfig.DEFAULT_USER.DISPLAY_NAME,
});

// Instantiate Channel Repository
const channelRepo = new ChannelRepository();

// Instantiate Message Repository
const messageRepo = new MessageRepository();

// Set up static channels
const staticChanelIdsList = ['newChannel', 'ANDROID', 'public_eko'];

class App extends PureComponent {
  state = {
    displayName: '',
    channels: [],
    currentChannelId: 'newChannel',
  };

  componentDidMount() {
    // Establish current user (only for demo purpose)
    const { currentUser } = client;

    // On current user data update, set current display name
    currentUser.on('dataUpdated', model =>
      this.setState({
        displayName: model.displayName,
      }),
    );

    // Get channel tags for each channel
    staticChanelIdsList.forEach(channelId => {
      this.addChannel(channelId);
    });
  }

  // Change the display name of current user
  changeDisplayName = displayName => {
    client.setDisplayName(displayName).catch(() => {
      message.error('Display Name Input Error');
    });
    this.setState({
      displayName,
    });
  };

  existingChannel = (value, channels) =>
    channels.some(channel => channel.channelId.toLowerCase() === value.toLowerCase());

  // Add channel to local state
  addChannel = channelId => {
    const liveChannel = channelRepo.channelForId(channelId);
    // On dataUpdated, retrieve the channels
    liveChannel.on('dataUpdated', data => {
      const { channels } = this.state;
      const channelIndex = channels.findIndex(channel => channel.channelId === data.channelId);
      if (channelIndex === -1) {
        this.setState({
          channels: [...channels, ...[data]],
        });
      } else {
        this.setState({
          channels: [
            ...channels.slice(0, channelIndex),
            { ...channels[channelIndex], ...data },
            ...channels.slice(channelIndex + 1),
          ],
        });
      }
    });
  };

  // Join selected channel
  joinChannel = channelId => {
    // Join channel
    channelRepo.joinChannel({
      channelId,
      type: EkoChannelType.Standard,
    });
    this.setState({
      currentChannelId: channelId,
    });
  };

  // Send message in channel
  sendMessage = (text, channelId) => {
    // Send message
    const messageLiveObject = messageRepo.createTextMessage({
      channelId,
      text,
    });
    // On message sent, run the following code.
    messageLiveObject.on('dataStatusChanged', () => {
      message.success('Message sent');
    });
  };

  render() {
    const { displayName, currentChannelId, channels } = this.state;
    return (
      <Container>
        <Header displayName={displayName} changeDisplayName={this.changeDisplayName} />
        <Row>
          <ChannelList>
            <ChannelListPanel
              channels={channels}
              currentChannelId={currentChannelId}
              addChannel={this.addChannel}
              existingChannel={this.existingChannel}
              joinChannel={this.joinChannel}
            />
          </ChannelList>
          <MessageListPanel>
            {currentChannelId && <MessageList currentChannelId={currentChannelId} />}
            <AddMessage sendMessage={this.sendMessage} currentChannelId={currentChannelId} />
          </MessageListPanel>
        </Row>
      </Container>
    );
  }
}

export default App;
