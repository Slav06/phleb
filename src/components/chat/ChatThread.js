import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  useToast,
  Avatar,
  Flex,
  Spinner,
  IconButton,
} from '@chakra-ui/react';
import { AttachmentIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import { supabase } from '../../supabaseClient';
import { useDropzone } from 'react-dropzone';

const ChatThread = ({ threadId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const messagesEndRef = useRef(null);
  const toast = useToast();

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 5242880, // 5MB
    onDrop: handleFileDrop,
  });

  useEffect(() => {
    fetchUser();
    fetchMessages();
    subscribeToMessages();
  }, [threadId]);

  const fetchUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data);
    } catch (error) {
      toast({
        title: 'Error fetching messages',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`chat_thread_${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleFileDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      setSending(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${threadId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      await sendMessage('', publicUrl);
    } catch (error) {
      toast({
        title: 'Error uploading file',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async (content, attachmentUrl = null) => {
    if (!content && !attachmentUrl) return;

    try {
      setSending(true);
      const { error } = await supabase.from('chat_messages').insert([
        {
          thread_id: threadId,
          sender_id: user.id,
          content,
          attachment_url: attachmentUrl,
        },
      ]);

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      toast({
        title: 'Error sending message',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Spinner />
      </Flex>
    );
  }

  return (
    <Box h="100vh" display="flex" flexDirection="column">
      <VStack
        flex={1}
        overflowY="auto"
        spacing={4}
        p={4}
        align="stretch"
      >
        {messages.map((message) => (
          <HStack
            key={message.id}
            spacing={4}
            align="start"
            justify={message.sender_id === user?.id ? 'flex-end' : 'flex-start'}
          >
            {message.sender_id !== user?.id && (
              <Avatar
                size="sm"
                src={message.profiles.avatar_url}
                name={message.profiles.full_name}
              />
            )}
            <Box
              maxW="70%"
              bg={message.sender_id === user?.id ? 'blue.500' : 'gray.100'}
              color={message.sender_id === user?.id ? 'white' : 'black'}
              p={3}
              borderRadius="lg"
            >
              {message.content && <Text>{message.content}</Text>}
              {message.attachment_url && (
                <Box mt={2}>
                  {message.attachment_url.match(/\.(jpg|jpeg|png)$/i) ? (
                    <img
                      src={message.attachment_url}
                      alt="Attachment"
                      style={{ maxWidth: '100%', borderRadius: '4px' }}
                    />
                  ) : (
                    <a
                      href={message.attachment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline">
                        View Attachment
                      </Button>
                    </a>
                  )}
                </Box>
              )}
              <Text fontSize="xs" mt={1} opacity={0.7}>
                {new Date(message.created_at).toLocaleTimeString()}
              </Text>
            </Box>
            {message.sender_id === user?.id && (
              <Avatar
                size="sm"
                src={message.profiles.avatar_url}
                name={message.profiles.full_name}
              />
            )}
          </HStack>
        ))}
        <div ref={messagesEndRef} />
      </VStack>

      <Box p={4} borderTopWidth={1}>
        <HStack spacing={2}>
          <Box {...getRootProps()} flex={1}>
            <input {...getInputProps()} />
            <IconButton
              icon={<AttachmentIcon />}
              variant="ghost"
              aria-label="Attach file"
            />
          </Box>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(newMessage);
              }
            }}
          />
          <IconButton
            aria-label="Send message"
            icon={<ArrowForwardIcon />}
            colorScheme="blue"
            onClick={() => sendMessage(newMessage)}
            isLoading={sending}
            isDisabled={!newMessage.trim()}
          />
        </HStack>
      </Box>
    </Box>
  );
};

export default ChatThread; 