import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_TASK_COMMENTS, CREATE_TASK_COMMENT } from '../graphql/queries';
import { useWebSocket } from '../hooks/useWebSocket';
import type { TaskComment } from '../types';

interface TaskCommentsProps {
  orgSlug: string;
  taskId: string;
  taskTitle: string;
}

const TaskComments: React.FC<TaskCommentsProps> = ({ orgSlug, taskId }) => {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<TaskComment[]>([]);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data, loading, error, refetch } = useQuery(GET_TASK_COMMENTS, {
    variables: { orgSlug, taskId },
    skip: !orgSlug || !taskId,
    fetchPolicy: 'cache-and-network'
  });

  const [createComment, { loading: creatingComment }] = useMutation(CREATE_TASK_COMMENT);

  // Initialize comments from GraphQL query
  useEffect(() => {
    if (data?.taskComments) {
      setComments(data.taskComments);
    }
  }, [data]);

  // Scroll to bottom when new comments are added
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  // Handle new comments from WebSocket - use useCallback to stabilize the reference
  const handleNewComment = useCallback((comment: TaskComment) => {
    setComments(prev => {
   
      if (!prev.find(c => c.id === comment.id)) {
        return [...prev, comment];
      }
      return prev;
    });
  }, []);

  const { isConnected, error: wsError, sendMessage } = useWebSocket({
    orgSlug,
    taskId,
    onNewComment: handleNewComment
  });

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || creatingComment) return;

    const commentContent = newComment.trim();
    setNewComment(''); 
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Send via GraphQL mutation (which will trigger WebSocket broadcast)
      const result = await createComment({
        variables: {
          orgSlug,
          taskId,
          content: commentContent
        }
      });

      // Only send via WebSocket if GraphQL fails or for immediate feedback
      if (!result.data) {
        sendMessage(commentContent);
      }
      
    } catch (error) {
      console.error('Error creating comment:', error);
      // Restore comment text on error
      setNewComment(commentContent);
      
      // Try sending via WebSocket as fallback
      const sent = sendMessage(commentContent);
      if (!sent) {
        // If both fail, show error to user
        alert('Failed to send comment. Please try again.');
      }
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewComment(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitComment(e);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center text-red-600">
          Error loading comments: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
        {wsError && (
          <p className="text-sm text-red-600 mt-1">{wsError}</p>
        )}
      </div>

      {/* Comments List */}
      <div className="h-96 overflow-y-auto p-6">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">💬</div>
            <p>No comments yet</p>
            <p className="text-sm">Be the first to comment on this task</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-700">
                      {comment.author.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {comment.author.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(comment.timestamp)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                    {comment.content}
                  </div>
                </div>
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>
        )}
      </div>

      {/* Comment Input */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmitComment} className="flex space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {localStorage.getItem('userName')?.charAt(0).toUpperCase() || 'Y'}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={newComment}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              placeholder="Type your comment... (Press Enter to send, Shift+Enter for new line)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={1}
              disabled={creatingComment}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {isConnected ? 'Connected to live chat' : 'Reconnecting...'}
              </span>
              <button
                type="submit"
                disabled={!newComment.trim() || creatingComment}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
              >
                {creatingComment ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskComments;