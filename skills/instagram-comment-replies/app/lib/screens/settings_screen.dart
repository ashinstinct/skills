import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/storage_service.dart';
import '../services/instagram_service.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _tokenCtrl = TextEditingController();
  final _accountCtrl = TextEditingController();
  bool _obscureToken = true;
  bool _testing = false;
  String? _testResult;
  bool _testOk = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final settings = await context.read<StorageService>().loadApiSettings();
    if (settings != null && mounted) {
      _tokenCtrl.text = settings.accessToken;
      _accountCtrl.text = settings.accountId;
    }
  }

  @override
  void dispose() {
    _tokenCtrl.dispose();
    _accountCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final token = _tokenCtrl.text.trim();
    final accountId = _accountCtrl.text.trim();
    if (token.isEmpty || accountId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Both fields are required')),
      );
      return;
    }
    await context.read<StorageService>().saveApiSettings(token, accountId);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Settings saved')),
      );
    }
  }

  Future<void> _test() async {
    setState(() {
      _testing = true;
      _testResult = null;
    });
    try {
      final ok = await InstagramService(
        accessToken: _tokenCtrl.text.trim(),
        accountId: _accountCtrl.text.trim(),
      ).testConnection();
      setState(() {
        _testOk = ok;
        _testResult =
            ok ? 'Connected successfully' : 'Connection failed — check your credentials';
      });
    } catch (e) {
      setState(() {
        _testOk = false;
        _testResult = 'Error: $e';
      });
    } finally {
      setState(() => _testing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('API Credentials',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 4),
          const Text(
            'Paste your Instagram Graph API credentials below. '
            'See the steps at the bottom of this screen if you need help getting them.',
            style: TextStyle(color: Colors.grey, fontSize: 13),
          ),
          const SizedBox(height: 20),
          TextFormField(
            controller: _tokenCtrl,
            obscureText: _obscureToken,
            decoration: InputDecoration(
              labelText: 'IG Access Token',
              border: const OutlineInputBorder(),
              suffixIcon: IconButton(
                icon: Icon(
                    _obscureToken ? Icons.visibility : Icons.visibility_off),
                onPressed: () =>
                    setState(() => _obscureToken = !_obscureToken),
              ),
            ),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _accountCtrl,
            decoration: const InputDecoration(
              labelText: 'IG Business Account ID',
              border: OutlineInputBorder(),
              hintText: '17841400000000000',
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _testing ? null : _test,
                  child: _testing
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Test Connection'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton(
                  onPressed: _save,
                  child: const Text('Save'),
                ),
              ),
            ],
          ),
          if (_testResult != null) ...[
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(
                  _testOk ? Icons.check_circle : Icons.cancel,
                  color: _testOk ? Colors.green : Colors.red,
                  size: 18,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    _testResult!,
                    style: TextStyle(
                        color: _testOk ? Colors.green : Colors.red,
                        fontSize: 13),
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 32),
          const Divider(),
          const SizedBox(height: 12),
          const Text('How to get your credentials',
              style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          _Step('1',
              'Go to developers.facebook.com → My Apps → Create App → Business'),
          _Step('2',
              'Add "Instagram Graph API" as a product inside your app'),
          _Step('3',
              'Under Roles → Test Users, add your own Instagram account'),
          _Step('4',
              'Open the Graph API Explorer, select your app and generate a token with these permissions:\ninstagram_basic, instagram_manage_comments, instagram_manage_messages, pages_read_engagement'),
          _Step('5',
              'Exchange for a long-lived token:\nGET /oauth/access_token?grant_type=fb_exchange_token&client_id={app_id}&client_secret={secret}&fb_exchange_token={token}'),
          _Step('6',
              'Get your IG Business Account ID:\nGET /me/accounts → find your Page ID, then\nGET /{page_id}?fields=instagram_business_account'),
        ],
      ),
    );
  }
}

class _Step extends StatelessWidget {
  final String number;
  final String text;
  const _Step(this.number, this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 13,
            backgroundColor: Theme.of(context).colorScheme.primaryContainer,
            child: Text(number,
                style: TextStyle(
                    fontSize: 11,
                    color:
                        Theme.of(context).colorScheme.onPrimaryContainer)),
          ),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 13))),
        ],
      ),
    );
  }
}
