import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/reply_rule.dart';

class ApiSettings {
  final String accessToken;
  final String accountId;
  const ApiSettings({required this.accessToken, required this.accountId});
}

class StorageService extends ChangeNotifier {
  static const _tokenKey = 'ig_access_token';
  static const _accountIdKey = 'ig_account_id';
  static const _rulesKey = 'reply_rules';
  static const _processedKey = 'processed_comment_ids';
  static const _intervalKey = 'poll_interval_minutes';

  final _secure = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
  late SharedPreferences _prefs;

  List<ReplyRule> _rules = [];
  int _pollIntervalMinutes = 2;

  List<ReplyRule> get rules => List.unmodifiable(_rules);
  int get pollIntervalMinutes => _pollIntervalMinutes;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    _loadRules();
    _pollIntervalMinutes = _prefs.getInt(_intervalKey) ?? 2;
  }

  void _loadRules() {
    final raw = _prefs.getString(_rulesKey);
    if (raw == null) {
      _rules = [];
      return;
    }
    final list = jsonDecode(raw) as List;
    _rules = list
        .map((e) => ReplyRule.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> saveApiSettings(String accessToken, String accountId) async {
    await _secure.write(key: _tokenKey, value: accessToken);
    await _secure.write(key: _accountIdKey, value: accountId);
    notifyListeners();
  }

  Future<ApiSettings?> loadApiSettings() async {
    final token = await _secure.read(key: _tokenKey);
    final accountId = await _secure.read(key: _accountIdKey);
    if (token == null || accountId == null || token.isEmpty || accountId.isEmpty) {
      return null;
    }
    return ApiSettings(accessToken: token, accountId: accountId);
  }

  Future<void> saveRules(List<ReplyRule> rules) async {
    _rules = rules;
    await _prefs.setString(
        _rulesKey, jsonEncode(rules.map((r) => r.toJson()).toList()));
    notifyListeners();
  }

  Future<void> addRule(ReplyRule rule) => saveRules([..._rules, rule]);

  Future<void> updateRule(ReplyRule rule) =>
      saveRules(_rules.map((r) => r.id == rule.id ? rule : r).toList());

  Future<void> deleteRule(String id) =>
      saveRules(_rules.where((r) => r.id != id).toList());

  Future<bool> isProcessed(String commentId) async {
    final ids = _prefs.getStringList(_processedKey) ?? [];
    return ids.contains(commentId);
  }

  Future<void> markProcessed(String commentId) async {
    final ids = _prefs.getStringList(_processedKey) ?? [];
    if (ids.contains(commentId)) return;
    // Keep last 10,000 to avoid unbounded growth
    if (ids.length >= 10000) ids.removeRange(0, ids.length - 9999);
    ids.add(commentId);
    await _prefs.setStringList(_processedKey, ids);
  }

  Future<void> setPollInterval(int minutes) async {
    _pollIntervalMinutes = minutes;
    await _prefs.setInt(_intervalKey, minutes);
    notifyListeners();
  }
}
