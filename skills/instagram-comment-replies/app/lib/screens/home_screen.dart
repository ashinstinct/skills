import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/bot_service.dart';
import '../services/storage_service.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Instagram Auto Reply'),
        centerTitle: true,
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _BotControlCard(),
          _IntervalRow(),
          const Padding(
            padding: EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Text('Activity', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
          const Expanded(child: _ActivityList()),
        ],
      ),
    );
  }
}

class _BotControlCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final bot = context.watch<BotService>();
    final running = bot.running;

    return Card(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Row(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: running ? Colors.green : Colors.grey,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    running ? 'Bot is running' : 'Bot is stopped',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  Text(
                    '${bot.totalReplies} repl${bot.totalReplies == 1 ? 'y' : 'ies'} sent this session',
                    style: Theme.of(context)
                        .textTheme
                        .bodySmall
                        ?.copyWith(color: Colors.grey),
                  ),
                ],
              ),
            ),
            Switch(
              value: running,
              onChanged: (v) => v ? bot.start() : bot.stop(),
            ),
          ],
        ),
      ),
    );
  }
}

class _IntervalRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final storage = context.watch<StorageService>();
    final bot = context.read<BotService>();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Row(
        children: [
          const Text('Check every'),
          const SizedBox(width: 12),
          DropdownButton<int>(
            value: storage.pollIntervalMinutes,
            items: [1, 2, 5, 10, 15, 30]
                .map((m) => DropdownMenuItem(
                    value: m, child: Text('$m minute${m == 1 ? '' : 's'}')))
                .toList(),
            onChanged: (v) async {
              if (v == null) return;
              await storage.setPollInterval(v);
              await bot.restart();
            },
          ),
        ],
      ),
    );
  }
}

class _ActivityList extends StatelessWidget {
  const _ActivityList();

  @override
  Widget build(BuildContext context) {
    final log = context.watch<BotService>().log;

    if (log.isEmpty) {
      return const Center(
        child: Text(
          'No activity yet.\nFlip the switch above to start.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.grey),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      itemCount: log.length,
      itemBuilder: (ctx, i) {
        final entry = log[i];
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 5),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                entry.isError
                    ? Icons.error_outline
                    : Icons.check_circle_outline,
                size: 16,
                color: entry.isError ? Colors.red : Colors.green,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(entry.message,
                        style: Theme.of(ctx).textTheme.bodySmall),
                    Text(
                      _ago(entry.time),
                      style: Theme.of(ctx)
                          .textTheme
                          .labelSmall
                          ?.copyWith(color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  String _ago(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inSeconds < 60) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    return '${diff.inHours}h ago';
  }
}
