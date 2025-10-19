import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
import axios from 'axios';

export default function UserListScreen({ navigation }) {
  const [users, setUsers] = useState([]);

  useEffect(() => {
   
     try {
         const res = axios.get('https://podiumapp.site/server/users/')

         console.log("Data of users",res.data )
     } catch (error) {
        
     }
  }, []);

  return (
    <FlatList
      data={users}
      keyExtractor={item => item.id.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate('UserDetail', { user: item })}>
          <View style={{ padding: 20, borderBottomWidth: 1 }}>
            <Text>{item.name}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}
