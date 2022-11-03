import { createComponent } from '@napred/browser';
import { gql, useMutation } from '@apollo/client';
import React, { ChangeEvent, KeyboardEvent, useState } from 'react';

const sendMessageMutation = gql`
  mutation SendMessageMutation($message: String!) {
    sendMessage(text: $message) {
      text
    }
  }
`;

const Input = createComponent('Input', 'input');

function MessageInput(props: any) {
  const [value, setValue] = useState('');
  const [sendMessage] = useMutation(sendMessageMutation);

  return (
    <Input
      onKeyUp={(e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && value.length > 0) {
          sendMessage({ variables: { message: value } });
          setValue('');
        }
      }}
      onChange={(e: ChangeEvent<HTMLInputElement>) =>
        setValue(e.currentTarget.value)
      }
      placeholder="Type something and press Enter"
      p={2}
      value={value}
      {...props}
    />
  );
}

export { MessageInput };
export default MessageInput;
