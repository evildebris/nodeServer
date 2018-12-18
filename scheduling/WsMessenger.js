const WsEvents = require('./WsEvents');
module.exports = {

    getHomeNote: function() {
        WsEvents.sendNewEvent({op: 'GET_HOME_NOTE'});
    },

    createNotebook: function(noteName, defaultInterpreterId) {
        WsEvents.sendNewEvent({
            op: 'NEW_NOTE',
            data: {
                name: noteName,
                defaultInterpreterId: defaultInterpreterId
            }
        });
    },

    moveNoteToTrash: function(noteId) {
        WsEvents.sendNewEvent({op: 'MOVE_NOTE_TO_TRASH', data: {id: noteId}});
    },

    moveFolderToTrash: function(folderId) {
        WsEvents.sendNewEvent({op: 'MOVE_FOLDER_TO_TRASH', data: {id: folderId}});
    },

    restoreNote: function(noteId) {
        WsEvents.sendNewEvent({op: 'RESTORE_NOTE', data: {id: noteId}});
    },

    restoreFolder: function(folderId) {
        WsEvents.sendNewEvent({op: 'RESTORE_FOLDER', data: {id: folderId}});
    },

    restoreAll: function() {
        WsEvents.sendNewEvent({op: 'RESTORE_ALL'});
    },

    deleteNote: function(noteId) {
        WsEvents.sendNewEvent({op: 'DEL_NOTE', data: {id: noteId}});
    },

    removeFolder: function(folderId) {
        WsEvents.sendNewEvent({op: 'REMOVE_FOLDER', data: {id: folderId}});
    },

    emptyTrash: function() {
        WsEvents.sendNewEvent({op: 'EMPTY_TRASH'});
    },

    cloneNote: function(noteIdToClone, newNoteName) {
        WsEvents.sendNewEvent({op: 'CLONE_NOTE', data: {id: noteIdToClone, name: newNoteName}});
    },

    getNotebookList: function() {
        WsEvents.sendNewEvent({op: 'LIST_NOTES'});
    },

    reloadAllNotesFromRepo: function() {
        WsEvents.sendNewEvent({op: 'RELOAD_NOTES_FROM_REPO'});
    },

    getNotebook: function(noteId) {
        WsEvents.sendNewEvent({op: 'GET_NOTE', data: {id: noteId}});
    },

    updateNote: function(noteId, noteName, noteConfig) {
        WsEvents.sendNewEvent({op: 'NOTE_UPDATE', data: {id: noteId, name: noteName, config: noteConfig}});
    },

    updatePersonalizedMode: function(noteId, modeValue) {
        WsEvents.sendNewEvent({op: 'UPDATE_PERSONALIZED_MODE', data: {id: noteId, personalized: modeValue}});
    },

    renameNote: function(noteId, noteName) {
        WsEvents.sendNewEvent({op: 'NOTE_RENAME', data: {id: noteId, name: noteName}});
    },

    renameFolder: function(folderId, folderName) {
        WsEvents.sendNewEvent({op: 'FOLDER_RENAME', data: {id: folderId, name: folderName}});
    },

    moveParagraph: function(paragraphId, newIndex) {
        WsEvents.sendNewEvent({op: 'MOVE_PARAGRAPH', data: {id: paragraphId, index: newIndex}});
    },

    insertParagraph: function(newIndex) {
        WsEvents.sendNewEvent({op: 'INSERT_PARAGRAPH', data: {index: newIndex}});
    },

    copyParagraph: function(newIndex, paragraphTitle, paragraphData,
                            paragraphConfig, paragraphParams) {
        WsEvents.sendNewEvent({
            op: 'COPY_PARAGRAPH',
            data: {
                index: newIndex,
                title: paragraphTitle,
                paragraph: paragraphData,
                config: paragraphConfig,
                params: paragraphParams
            }
        });
    },

    updateAngularObject: function(noteId, paragraphId, name, value, interpreterGroupId) {
        WsEvents.sendNewEvent({
            op: 'ANGULAR_OBJECT_UPDATED',
            data: {
                noteId: noteId,
                paragraphId: paragraphId,
                name: name,
                value: value,
                interpreterGroupId: interpreterGroupId
            }
        });
    },

    clientBindAngularObject: function(noteId, name, value, paragraphId) {
        WsEvents.sendNewEvent({
            op: 'ANGULAR_OBJECT_CLIENT_BIND',
            data: {
                noteId: noteId,
                name: name,
                value: value,
                paragraphId: paragraphId
            }
        });
    },

    clientUnbindAngularObject: function(noteId, name, paragraphId) {
        WsEvents.sendNewEvent({
            op: 'ANGULAR_OBJECT_CLIENT_UNBIND',
            data: {
                noteId: noteId,
                name: name,
                paragraphId: paragraphId
            }
        });
    },

    cancelParagraphRun: function(paragraphId) {
        WsEvents.sendNewEvent({op: 'CANCEL_PARAGRAPH', data: {id: paragraphId}});
    },

    /*paragraphExecutedBySpell: function(paragraphId, paragraphTitle,
     paragraphText, paragraphResultsMsg,
     paragraphStatus, paragraphErrorMessage,
     paragraphConfig, paragraphParams) {
     WsEvents.sendNewEvent({
     op: 'PARAGRAPH_EXECUTED_BY_SPELL',
     data: {
     id: paragraphId,
     title: paragraphTitle,
     paragraph: paragraphText,
     results: {
     code: paragraphStatus,
     msg: paragraphResultsMsg.map(dataWithType => {
     let serializedData = dataWithType.data;
     return { type: dataWithType.type, data: serializedData, };
     })
     },
     status: paragraphStatus,
     errorMessage: paragraphErrorMessage,
     config: paragraphConfig,
     params: paragraphParams
     }
     });
     },*/

    runParagraph: function(paragraphId, paragraphTitle, paragraphData, paragraphConfig, paragraphParams) {
        WsEvents.sendNewEvent({
            op: 'RUN_PARAGRAPH',
            data: {
                id: paragraphId,
                title: paragraphTitle,
                paragraph: paragraphData,
                config: paragraphConfig,
                params: paragraphParams
            }
        });
    },

    runAllParagraphs: function(noteId, paragraphs) {
        WsEvents.sendNewEvent({
            op: 'RUN_ALL_PARAGRAPHS',
            data: {
                noteId: noteId,
                paragraphs: JSON.stringify(paragraphs)
            }
        });
    },

    removeParagraph: function(paragraphId) {
        WsEvents.sendNewEvent({op: 'PARAGRAPH_REMOVE', data: {id: paragraphId}});
    },

    clearParagraphOutput: function(paragraphId) {
        WsEvents.sendNewEvent({op: 'PARAGRAPH_CLEAR_OUTPUT', data: {id: paragraphId}});
    },

    clearAllParagraphOutput: function(noteId) {
        WsEvents.sendNewEvent({op: 'PARAGRAPH_CLEAR_ALL_OUTPUT', data: {id: noteId}});
    },

    completion: function(paragraphId, buf, cursor) {
        WsEvents.sendNewEvent({
            op: 'COMPLETION',
            data: {
                id: paragraphId,
                buf: buf,
                cursor: cursor
            }
        });
    },

    commitParagraph: function(paragraphId, paragraphTitle, paragraphData, paragraphConfig, paragraphParams) {
        WsEvents.sendNewEvent({
            op: 'COMMIT_PARAGRAPH',
            data: {
                id: paragraphId,
                title: paragraphTitle,
                paragraph: paragraphData,
                config: paragraphConfig,
                params: paragraphParams
            }
        });
    },

    importNote: function(note) {
        WsEvents.sendNewEvent({
            op: 'IMPORT_NOTE',
            data: {
                note: note
            }
        });
    },

    checkpointNote: function(noteId, commitMessage) {
        WsEvents.sendNewEvent({
            op: 'CHECKPOINT_NOTE',
            data: {
                noteId: noteId,
                commitMessage: commitMessage
            }
        });
    },

    setNoteRevision: function(noteId, revisionId) {
        WsEvents.sendNewEvent({
            op: 'SET_NOTE_REVISION',
            data: {
                noteId: noteId,
                revisionId: revisionId
            }
        });
    },

    listRevisionHistory: function(noteId) {
        WsEvents.sendNewEvent({
            op: 'LIST_REVISION_HISTORY',
            data: {
                noteId: noteId
            }
        });
    },

    getNoteByRevision: function(noteId, revisionId) {
        WsEvents.sendNewEvent({
            op: 'NOTE_REVISION',
            data: {
                noteId: noteId,
                revisionId: revisionId
            }
        });
    },

    getEditorSetting: function(paragraphId, replName) {
        WsEvents.sendNewEvent({
            op: 'EDITOR_SETTING',
            data: {
                paragraphId: paragraphId,
                magic: replName
            }
        });
    },

    isConnected: function() {
        return WsEvents.isConnected();
    },

    getNoteJobsList: function() {
        WsEvents.sendNewEvent({op: 'LIST_NOTE_JOBS'});
    },

    getUpdateNoteJobsList: function(lastUpdateServerUnixTime) {
        WsEvents.sendNewEvent(
            {op: 'LIST_UPDATE_NOTE_JOBS', data: {lastUpdateUnixTime: lastUpdateServerUnixTime * 1}}
        );
    },

    unsubscribeJobManager: function() {
        WsEvents.sendNewEvent({op: 'UNSUBSCRIBE_UPDATE_NOTE_JOBS'});
    },

    getInterpreterBindings: function(noteId) {
        WsEvents.sendNewEvent({op: 'GET_INTERPRETER_BINDINGS', data: {noteId: noteId}});
    },

    saveInterpreterBindings: function(noteId, selectedSettingIds) {
        WsEvents.sendNewEvent({op: 'SAVE_INTERPRETER_BINDINGS',
            data: {noteId: noteId, selectedSettingIds: selectedSettingIds}});
    },

    listConfigurations: function() {
        WsEvents.sendNewEvent({op: 'LIST_CONFIGURATIONS'});
    },

    getInterpreterSettings: function() {
        WsEvents.sendNewEvent({op: 'GET_INTERPRETER_SETTINGS'});
    },

    rest:WsEvents.rest,
    apiRest:WsEvents.apiRest,
    getApiUrl:WsEvents.getApiUrl

};