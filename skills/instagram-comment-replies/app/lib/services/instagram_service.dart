import 'dart:convert';
import 'package:http/http.dart' as http;

class IgMedia {
  final String id;
  final String? caption;
  final String timestamp;

  const IgMedia({required this.id, this.caption, required this.timestamp});

  factory IgMedia.fromJson(Map<String, dynamic> j) => IgMedia(
        id: j['id'] as String,
        caption: j['caption'] as String?,
        timestamp: j['timestamp'] as String,
      );
}

class IgComment {
  final String id;
  final String text;
  final String? username;
  final String? fromId;
  final String timestamp;

  const IgComment({
    required this.id,
    required this.text,
    this.username,
    this.fromId,
    required this.timestamp,
  });

  factory IgComment.fromJson(Map<String, dynamic> j) => IgComment(
        id: j['id'] as String,
        text: j['text'] as String,
        username: j['username'] as String?,
        fromId: (j['from'] as Map<String, dynamic>?)?['id'] as String?,
        timestamp: j['timestamp'] as String,
      );
}

class InstagramService {
  static const _base = 'https://graph.facebook.com/v19.0';

  final String accessToken;
  final String accountId;

  InstagramService({required this.accessToken, required this.accountId});

  Future<List<IgMedia>> fetchRecentMedia({int limit = 10}) async {
    final uri =
        Uri.parse('$_base/$accountId/media').replace(queryParameters: {
      'fields': 'id,caption,timestamp',
      'limit': '$limit',
      'access_token': accessToken,
    });
    final res = await http.get(uri);
    _check(res);
    final data = (jsonDecode(res.body) as Map)['data'] as List;
    return data
        .map((e) => IgMedia.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<IgComment>> fetchComments(String mediaId) async {
    final uri =
        Uri.parse('$_base/$mediaId/comments').replace(queryParameters: {
      'fields': 'id,text,username,from,timestamp',
      'limit': '100',
      'access_token': accessToken,
    });
    final res = await http.get(uri);
    _check(res);
    final data = (jsonDecode(res.body) as Map)['data'] as List;
    return data
        .map((e) => IgComment.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> replyToComment(String commentId, String message) async {
    final res = await http.post(
      Uri.parse('$_base/$commentId/replies'),
      body: {'message': message, 'access_token': accessToken},
    );
    _check(res);
  }

  Future<void> sendDM(String recipientId, String message) async {
    final res = await http.post(
      Uri.parse('$_base/$accountId/messages'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'recipient': {'id': recipientId},
        'message': {'text': message},
        'messaging_type': 'RESPONSE',
        'access_token': accessToken,
      }),
    );
    _check(res);
  }

  Future<bool> testConnection() async {
    try {
      final uri = Uri.parse('$_base/$accountId').replace(queryParameters: {
        'fields': 'id,name',
        'access_token': accessToken,
      });
      final res = await http.get(uri);
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  void _check(http.Response res) {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw Exception('Instagram API ${res.statusCode}: ${res.body}');
    }
  }
}
