import React, { Component } from 'react';
import PropTypes from 'prop-types';
import rantscript from '../../consts/rantscript';
import SmartArea from '../utilities/smart_area';
import Loading from '../utilities/loading';
import { ITEM } from '../../consts/types';
import Popup from '../utilities/popup';
import Dropdown from '../utilities/dropdown/dropdown';

const RANT_TYPES = [
  {
    id: 1, color: '#d55063', icon: 'icon ion-chatbubble-working', header: 'Rant / Story',
  },
  {
    id: 3, color: '#2b8a9c', icon: 'icon ion-image', header: 'Joke / Meme',
  },
  {
    id: 4, color: '#ab73a2', icon: 'icon ion-help', header: 'Question',
  },
  {
    id: 5, color: '#fa9a67', icon: 'icon ion-heart', header: 'devRant',
  },
  {
    id: 6, color: '#7ac8a6', icon: 'icon ion-ios-game-controller-a', header: 'Random',
  },
];

class PostRant extends Component {
  constructor() {
    super();
    this.state = {
      rantContent: '',
      tags: '',
      disabled: false,
      type: 1,
      draftName: '',
      popup: {
        visible: false,
        className: '',
        pos: 'Ok',
        body: '',
      },
    };
  }

  componentWillMount() {
    const { postRant } = this.props;
    if (postRant.autoSave.content) {
      this.setState({ rantContent: postRant.autoSave.content, tags: postRant.autoSave.tags });
    }
  }

  componentDidMount() {
    const { auth, item } = this.props;
    if (item.id === 0) {
      return;
    }
    const authToken = auth.user.authToken;
    rantscript.rant(item.id, authToken)
      .then((res) => {
        const rant = res.rant;
        this.setState({
          rantContent: rant.text,
          tags: rant.tags.join(),
        });
      });
  }

  componentWillUnmount() {
    this.props.saveAutoSave({ content: this.state.rantContent, tags: this.state.tags });
  }

  saveDraft() {
    const { draftName, rantContent, tags } = this.state;
    if (draftName !== '') {
      this.props.addDraft(draftName, { content: rantContent, tags });
    }
  }

  getDraft(index) {
    const { postRant } = this.props;
    const draft = postRant.drafts[index];
    if (draft.name && draft.rant) {
      this.setState({
        draftName: draft.name, rantContent: draft.rant.content, tags: draft.rant.tags,
      });
    }
  }

  removeDraft(name) {
    const { removeDraft } = this.props;
    removeDraft(name);
  }

  editRant(text) {
    const { auth, item } = this.props;
    rantscript
      .editRant(text, this.state.tags, item.id, auth.user.authToken)
      .then((res) => {
        if (!res.success) {
          this.setState({
            popup:
            {
              ...this.state.popup, body: res.error, visible: true, className: '',
            },
          });
          return;
        }
        this.props.clearAutoSave();
        this.setState({
          rantContent: '',
          tags: '',
        });
        this.props.open(ITEM.RANT.NAME, item.id);
      })
      .catch(() => {
      });
  }

  onPost(text, image) {
    const { auth, item } = this.props;
    if (item.id !== 0) {
      this.editRant(text);
      return;
    }
    rantscript
      .postRant(text, this.state.tags, this.state.type, auth.user.authToken, image)
      .then((res) => {
        if (!res.success) {
          this.setState({
            popup:
            {
              ...this.state.popup, body: res.error, visible: true, className: '',
            },
          });
          return;
        }
        this.props.clearAutoSave();
        this.setState({
          rantContent: '',
          tags: '',
          disabled: true,
        });
        this.props.open(ITEM.RANT.NAME, res.rant_id);
      })
      .catch(() => {
      });
  }

  render() {
    const {
      auth, item, postRant, theme,
    } = this.props;
    const { popup } = this.state;
    if (item.id !== 0 && this.state.rantContent === '') {
      return (
        <div className="modal" >
          <Loading />
        </div>
      );
    }
    return (
      <div
        className="modal"
      >
        <div className="post_rant_container">
          <Popup
            {...popup}
            onPos={() => {
              this.setState({ popup: { ...this.state.popup, className: 'closeAnim' } });
              setTimeout(() => {
                this.setState({ popup: { ...this.state.popup, visible: false } });
              }, 300);
            }}
          />
          <div className="post_rant">
            <SmartArea
              onPost={(text, image) => this.onPost(text, image)}
              value={this.state.rantContent}
              onChange={text => this.setState({ rantContent: text })}
              disabled={this.state.disabled || auth.user === null}
              placeholder="The rant starts here..."
              tags={this.state.tags}
              maxChar={5000}
              editing={item.id !== 0}
              onTagsChange={tags => this.setState({ tags })}
              theme={theme}
            />
          </div>
          <div
            className="utils"
            style={{
              backgroundColor: theme.backgroundColor,
              color: theme.item_card.color,
            }}
          >
            <span className="header">Rant Type</span>
            <Dropdown
              items={RANT_TYPES}
              noBackground
              onSelect={type => this.setState({ type: type.id })}
            />
            <span className="header">Save draft</span>
            <div className="save_draft">
              <input
                style={{ backgroundColor: theme.item_card.backgroundColor }}
                onChange={e => this.setState({ draftName: e.currentTarget.value })}
                value={this.state.draftName}
                placeholder="Title of Draft"
              />
              <button
                onClick={() => this.saveDraft()}
                style={{
                  backgroundColor: theme.plus_notif ? theme.plus_notif.backgroundColor : '#dd4242',
                  color: theme.id === 'dark_theme' ? '#ffffff' : theme.item_card.backgroundColor,
                }}
              >Save Draft
              </button>
            </div>
            <span className="header">Saved Drafts</span>
            <div
              className="drafts_container"
              style={{ backgroundColor: theme.item_card.backgroundColor }}
            >
              <div
                className="drafts"
                style={{
                  backgroundColor: theme.item_card.backgroundColor,
                  color: theme.item_card.color,
                }}
              >
                {
                  postRant.drafts.length !== 0 ?
                    postRant.drafts.map((draft, index) => (
                      <div
                        className="draft"
                        key={draft.name}
                      >
                        <span className="d_name" >{draft.name}</span>
                        <div className="actions">
                          <button
                            onClick={() => this.getDraft(index)}
                            style={{
                              background: theme.plus_notif ? theme.plus_notif.backgroundColor : '#dd4242',
                              color: theme.id === 'dark_theme' ? '#ffffff' : theme.item_card.backgroundColor,
                            }}
                          >Load
                          </button>
                          <button
                            onClick={() => this.removeDraft(draft.name)}
                            style={{
                              background: theme.plus_notif ? theme.plus_notif.backgroundColor : '#dd4242',
                              color: theme.id === 'dark_theme' ? '#ffffff' : theme.item_card.backgroundColor,
                            }}
                          >Delete
                          </button>
                        </div>
                      </div>
                    ))
                    : <div className="noDrafts"><span >No Drafts Saved</span></div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}


PostRant.propTypes = {
  auth: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  item: PropTypes.object.isRequired,
  postRant: PropTypes.object.isRequired,
  open: PropTypes.func.isRequired,
  saveAutoSave: PropTypes.func.isRequired,
  clearAutoSave: PropTypes.func.isRequired,
  addDraft: PropTypes.func.isRequired,
  removeDraft: PropTypes.func.isRequired,
};

export default PostRant;
